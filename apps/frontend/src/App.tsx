import { useCallback, useEffect, useState } from 'react'
import {
  addProduct,
  addToCart,
  checkActuatorHealth,
  checkApiHealth,
  checkDatabaseHealth,
  getCart,
  getProduct,
  getProducts,
  postSession,
  removeFromCart,
  setProductInactive,
  updateProduct,
  type CartDTO,
  type EndpointStatus,
  type ProductDTO,
  type ProductStatus,
} from './api'
import './App.css'

const ANALYTICS_STORAGE_KEY = 'asta.analyticsId'

type Route = 'shop' | 'admin'

type Notice = {
  kind: 'success' | 'error' | 'info'
  text: string
}

type ProductFormState = {
  publicId: string | null
  name: string
  description: string
  imagePath: string
  priceEuro: string
  amountInStock: string
  tag: string
  status: ProductStatus
}

const emptyProductForm: ProductFormState = {
  publicId: null,
  name: '',
  description: '',
  imagePath: '',
  priceEuro: '',
  amountInStock: '0',
  tag: '',
  status: 'ACTIVE',
}

let analyticsPosted = false

function App() {
  const [route, setRoute] = useState<Route>(getRoute())
  const [analyticsId] = useState(getOrCreateAnalyticsId)
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [cartItems, setCartItems] = useState<CartDTO[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')

  useEffect(() => {
    const onPopState = () => setRoute(getRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  useEffect(() => {
    if (!analyticsPosted) {
      analyticsPosted = true
      postSession({
        analyticsId,
        loginTimestamp: new Date().toISOString(),
      }).catch((error: unknown) => {
        console.warn('Analytics request failed', error)
      })
    }
  }, [analyticsId])

  const loadProducts = useCallback(async () => {
    setProductsLoading(true)
    setProductsError('')

    try {
      const nextProducts = await getProducts()
      setProducts(nextProducts)
      setSelectedProduct((currentProduct) => {
        if (
          currentProduct?.publicId &&
          !nextProducts.some((product) => product.publicId === currentProduct.publicId && isProductActive(product))
        ) {
          return null
        }

        return currentProduct
      })
    } catch (error) {
      setProductsError(readError(error, 'Produkte konnten nicht geladen werden.'))
    } finally {
      setProductsLoading(false)
    }
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadProducts()
    })
  }, [loadProducts])

  const loadCart = useCallback(async () => {
    setCartLoading(true)
    setCartError('')

    try {
      const nextCart = await getCart(analyticsId)
      setCartItems(nextCart)
    } catch (error) {
      setCartError(readError(error, 'Warenkorb konnte nicht geladen werden.'))
    } finally {
      setCartLoading(false)
    }
  }, [analyticsId])

  useEffect(() => {
    queueMicrotask(() => {
      void loadCart()
    })
  }, [loadCart])

  function navigate(nextRoute: Route) {
    const path = nextRoute === 'admin' ? '/admin/panel' : '/'
    window.history.pushState({}, '', path)
    setRoute(nextRoute)
  }

  async function selectProduct(publicId: string | null) {
    if (!publicId) {
      setDetailError('Dieses Produkt hat keine publicId.')
      return
    }

    setDetailLoading(true)
    setDetailError('')

    try {
      const product = await getProduct(publicId)
      setSelectedProduct(product)

      if (!product) {
        setDetailError('Produkt wurde von der API nicht gefunden.')
      }
    } catch (error) {
      setDetailError(readError(error, 'Produktdetails konnten nicht geladen werden.'))
    } finally {
      setDetailLoading(false)
    }
  }

  async function addProductToCart(product: ProductDTO) {
    if (!product.publicId) {
      setCartError('Dieses Produkt hat keine publicId.')
      return
    }

    setCartError('')

    try {
      await addToCart({
        analyticsId,
        publicProductId: product.publicId,
        amountSelected: 1,
        status: 1,
      })
      await loadCart()
    } catch (error) {
      setCartError(readError(error, 'Produkt konnte nicht in den Warenkorb gelegt werden.'))
    }
  }

  async function removeProductFromCart(publicProductId: string) {
    setCartError('')

    try {
      const nextCart = await removeFromCart(analyticsId, publicProductId)
      setCartItems(nextCart)
    } catch (error) {
      setCartError(readError(error, 'Produkt konnte nicht aus dem Warenkorb entfernt werden.'))
    }
  }

  const activeProducts = products.filter(isProductActive)
  const productCount = activeProducts.length

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header route={route} navigate={navigate} />

      {/* Main content wächst, damit der Footer immer ganz unten bleibt */}
      <main className="main-content" style={{ flex: '1', padding: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {route === 'admin' ? (
            <AdminPanel
              onRefreshProducts={loadProducts}
              products={products}
              productsError={productsError}
              productsLoading={productsLoading}
            />
          ) : (
            <ShopView
              analyticsId={analyticsId}
              detailError={detailError}
              detailLoading={detailLoading}
              cartError={cartError}
              cartItems={cartItems}
              cartLoading={cartLoading}
              onAddToCart={addProductToCart}
              onRefreshProducts={loadProducts}
              onRemoveFromCart={removeProductFromCart}
              onSelectProduct={selectProduct}
              productCount={productCount}
              products={activeProducts}
              productsError={productsError}
              productsLoading={productsLoading}
              selectedProduct={selectedProduct}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}

// Header
function Header({ route, navigate }: { route: Route; navigate: (nextRoute: Route) => void }) {
  return (
    <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', borderBottom: '1px solid #eaeaea' }}>
      <a
        className="brand"
        href="/"
        onClick={(event) => {
          event.preventDefault()
          navigate('shop')
        }}
      >
        <span className="brand-mark">A</span>
        <span>
          <strong>AStA Shop</strong>
          <small>MVP Storefront</small>
        </span>
      </a>

      <nav className="topnav" aria-label="Hauptnavigation">
        <a
          aria-current={route === 'shop' ? 'page' : undefined}
          href="/"
          onClick={(event) => {
            event.preventDefault()
            navigate('shop')
          }}
        >
          Shop
        </a>
        <a
          aria-current={route === 'admin' ? 'page' : undefined}
          href="/admin/panel"
          onClick={(event) => {
            event.preventDefault()
            navigate('admin')
          }}
        >
          Admin
        </a>
      </nav>
    </header>
  )
}

// Footer 
function Footer() {
  return (
    <footer 
      className="site-footer" 
      style={{
        marginTop: 'auto', // Pushed nach unten, wenn main-content flex: 1 hat
        padding: '2rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        gap: '0.75rem',
        color: '#6b7280',
        fontSize: '0.875rem',
        borderTop: '1px solid #eaeaea',
        backgroundColor: '#fafafa'
      }}
    >
      <p>&copy; {new Date().getFullYear()} AStA Webshop. Alle Rechte vorbehalten.</p>
      <nav style={{ display: 'flex', gap: '1.5rem' }}>
        <a 
          href="/impressum" 
          onClick={(e) => e.preventDefault()}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Impressum
        </a>
        <a 
          href="/datenschutz" 
          onClick={(e) => e.preventDefault()}
          style={{ color: 'inherit', textDecoration: 'none' }}
        >
          Datenschutz
        </a>
      </nav>
    </footer>
  )
}

function ShopView({
  analyticsId,
  cartError,
  cartItems,
  cartLoading,
  detailError,
  detailLoading,
  onAddToCart,
  onRefreshProducts,
  onRemoveFromCart,
  onSelectProduct,
  productCount,
  products,
  productsError,
  productsLoading,
  selectedProduct,
}: {
  analyticsId: string
  cartError: string
  cartItems: CartDTO[]
  cartLoading: boolean
  detailError: string
  detailLoading: boolean
  onAddToCart: (product: ProductDTO) => Promise<void>
  onRefreshProducts: () => Promise<void>
  onRemoveFromCart: (publicProductId: string) => Promise<void>
  onSelectProduct: (publicId: string | null) => Promise<void>
  productCount: number
  products: ProductDTO[]
  productsError: string
  productsLoading: boolean
  selectedProduct: ProductDTO | null
}) {
  const cartProductIds = new Set(cartItems.map((item) => item.publicProductId))

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
      
      {/* Linke Seite: Hero + Produktliste */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        <section style={{ backgroundColor: '#f3f4f6', padding: '3rem', borderRadius: '1rem' }}>
          <p className="eyebrow" style={{ color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Kollektion 2026</p>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '0.5rem', marginBottom: '1rem' }}>Dein Campus. Dein Style.</h1>
          <p className="lede" style={{ color: '#4b5563', maxWidth: '600px' }}>
            Offizieller Merch der Beruflichen Hochschule Hamburg.
          </p>
          <div style={{ marginTop: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button className="secondary-button" type="button" onClick={() => void onRefreshProducts()}>
              Kollektion aktualisieren
            </button>
            <small style={{ color: '#9ca3af' }}>{productCount} Artikel verfügbar</small>
          </div>
        </section>

        <section>
          {productsLoading ? <StateMessage title="Produkte werden geladen..." /> : null}
          {productsError ? <StateMessage tone="error" title={productsError} /> : null}
          {!productsLoading && !productsError && products.length === 0 ? (
            <StateMessage title="Noch keine Produkte vorhanden" text="Lege im Admin-Panel ein erstes Produkt an." />
          ) : null}

          <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '1.5rem' }}>
            {products.map((product) => (
              <ProductCard
                key={product.publicId ?? product.name}
                isInCart={product.publicId ? cartProductIds.has(product.publicId) : false}
                onAddToCart={() => void onAddToCart(product)}
                onSelect={() => void onSelectProduct(product.publicId)}
                product={product}
              />
            ))}
          </div>
        </section>
      </div>

      {/* Rechte Seite: Sticky Sidebar (Warenkorb & Details) */}
      <aside style={{ position: 'sticky', top: '5.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Session Panel Card */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
          <p className="eyebrow" style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Session</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.5rem' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>Analytics-ID</span>
            <code style={{ fontSize: '0.75rem', padding: '0.25rem', backgroundColor: '#f3f4f6', borderRadius: '0.25rem', wordBreak: 'break-all' }}>
              {analyticsId || 'wird erstellt...'}
            </code>
          </div>
        </div>

        {/* Cart Section */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>Warenkorb</h2>
            <span style={{ backgroundColor: '#4f46e5', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.125rem 0.5rem', borderRadius: '999px' }}>
              {cartItems.length}
            </span>
          </div>

          {cartLoading ? <StateMessage title="Lädt..." /> : null}
          {cartError ? <StateMessage tone="error" title={cartError} /> : null}
          {!cartLoading && !cartError && cartItems.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Dein Warenkorb ist leer.</p>
          ) : null}
          {!cartLoading && cartItems.length > 0 ? (
            <CartList
              cartItems={cartItems}
              onRemoveFromCart={onRemoveFromCart}
              products={products}
            />
          ) : null}
        </div>

        {/* Detail Section */}
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>Details</h2>
          {detailLoading ? <StateMessage title="Lädt..." /> : null}
          {detailError ? <StateMessage tone="error" title={detailError} /> : null}
          {!detailLoading && !detailError && selectedProduct ? (
            <ProductDetail product={selectedProduct} />
          ) : null}
          {!detailLoading && !detailError && !selectedProduct ? (
            <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '2rem 0' }}>Wähle ein Produkt für Details.</p>
          ) : null}
        </div>

      </aside>
    </div>
  )
}

function ProductCard({
  isInCart,
  onAddToCart,
  onSelect,
  product,
}: {
  isInCart: boolean
  onAddToCart: () => void
  onSelect: () => void
  product: ProductDTO
}) {
  return (
    <article className="product-card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', backgroundColor: '#fff', transition: 'transform 0.2s', cursor: 'pointer' }} onClick={onSelect}>
      <div style={{ height: '200px', backgroundColor: '#f9fafb' }}>
        <ProductImage imagePath={product.imagePath} name={product.name} />
      </div>
      <div className="product-card-body" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div style={{ marginBottom: '1rem' }}>
          <p className="tag" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#4f46e5', marginBottom: '0.25rem' }}>{product.tag || 'ohne Tag'}</p>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>{product.name || 'Unbenanntes Produkt'}</h3>
        </div>
        
        <div className="product-meta" style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <strong style={{ fontSize: '1.25rem', fontWeight: 900 }}>{formatPrice(product.price)}</strong>
          <span style={{ fontSize: '0.75rem', color: '#6b7280' }}>{product.amountInStock} auf Lager</span>
        </div>
        
        <button 
          className="primary-button" 
          disabled={isInCart} 
          type="button" 
          onClick={(e) => { e.stopPropagation(); onAddToCart(); }}
          style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', backgroundColor: isInCart ? '#e5e7eb' : '#111827', color: isInCart ? '#9ca3af' : '#fff', border: 'none', cursor: isInCart ? 'not-allowed' : 'pointer' }}
        >
          {isInCart ? 'Im Warenkorb ✓' : 'Hinzufügen +'}
        </button>
      </div>
    </article>
  )
}

function CartList({
  cartItems,
  onRemoveFromCart,
  products,
}: {
  cartItems: CartDTO[]
  onRemoveFromCart: (publicProductId: string) => Promise<void>
  products: ProductDTO[]
}) {
  return (
    <div className="cart-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {cartItems.map((item, index) => {
        const product = products.find((entry) => entry.publicId === item.publicProductId)
        const title = product?.name ?? item.publicProductId

        return (
          <article className="cart-row" key={`${item.publicProductId}-${item.status}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.75rem' }}>
            <div>
              <h3 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 700 }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0' }}>
                {item.amountSelected}x
                {product ? ` · ${formatPrice(product.price * item.amountSelected)}` : ''}
              </p>
            </div>
            <button
              className="danger-button"
              type="button"
              onClick={() => void onRemoveFromCart(item.publicProductId)}
              style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '0.25rem', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Löschen
            </button>
          </article>
        )
      })}
    </div>
  )
}

function ProductDetail({ product }: { product: ProductDTO }) {
  return (
    <div className="detail-layout" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ height: '180px', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        <ProductImage imagePath={product.imagePath} name={product.name} />
      </div>
      <div>
        <p className="tag" style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#4f46e5' }}>{product.tag || 'ohne Tag'}</p>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0.25rem 0 0.5rem 0' }}>{product.name}</h3>
        <p style={{ fontSize: '0.875rem', color: '#4b5563', lineHeight: 1.5, marginBottom: '1rem' }}>{product.description || 'Keine Beschreibung hinterlegt.'}</p>
        
        <dl className="details-list" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.75rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '0.5rem' }}>
          <div>
            <dt style={{ color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}>ID</dt>
            <dd style={{ margin: 0, fontFamily: 'monospace' }}>{product.publicId?.slice(0, 8) ?? 'n/a'}</dd>
          </div>
          <div>
            <dt style={{ color: '#6b7280', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.65rem' }}>Status</dt>
            <dd style={{ margin: 0, color: product.status === 'ACTIVE' ? '#10b981' : '#ef4444', fontWeight: 'bold' }}>{formatProductStatus(product.status)}</dd>
          </div>
        </dl>
      </div>
    </div>
  )
}

function AdminPanel({
  onRefreshProducts,
  products,
  productsError,
  productsLoading,
}: {
  onRefreshProducts: () => Promise<void>
  products: ProductDTO[]
  productsError: string
  productsLoading: boolean
}) {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(form.publicId)

  function editProduct(product: ProductDTO) {
    setForm(toProductForm(product))
    setNotice({ kind: 'info', text: 'Produkt ist im Formular geladen.' })
  }

  function resetForm() {
    setForm(emptyProductForm)
    setNotice(null)
  }

  async function submitProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const validationError = validateProductForm(form, isEditing)
    if (validationError) {
      setNotice({ kind: 'error', text: validationError })
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      const payload = formToProduct(form)

      if (isEditing) {
        await updateProduct(payload)
        setNotice({ kind: 'success', text: 'Produkt wurde aktualisiert.' })
      } else {
        await addProduct({
          name: payload.name,
          description: payload.description,
          imagePath: payload.imagePath,
          price: payload.price,
          amountInStock: payload.amountInStock,
          tag: payload.tag,
          status: payload.status,
        })
        setNotice({ kind: 'success', text: 'Produkt wurde angelegt.' })
        setForm(emptyProductForm)
      }

      await onRefreshProducts()
    } catch (error) {
      setNotice({ kind: 'error', text: readError(error, 'Produkt konnte nicht gespeichert werden.') })
    } finally {
      setSaving(false)
    }
  }

  async function setInactiveProduct(product: ProductDTO) {
    if (!product.publicId) {
      setNotice({ kind: 'error', text: 'Produkt hat keine publicId und kann nicht inaktiv gesetzt werden.' })
      return
    }

    if (product.status === 'INACTIVE') {
      setNotice({ kind: 'info', text: 'Produkt ist bereits inaktiv.' })
      return
    }

    setSaving(true)
    setNotice(null)

    try {
      await setProductInactive(product.publicId)
      setNotice({ kind: 'success', text: 'Produkt wurde inaktiv gesetzt.' })

      if (form.publicId === product.publicId) {
        setForm(emptyProductForm)
      }

      await onRefreshProducts()
    } catch (error) {
      setNotice({ kind: 'error', text: readError(error, 'Produkt konnte nicht inaktiv gesetzt werden.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-grid admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      
      <section className="admin-head" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '2rem' }}>
        <p className="eyebrow" style={{ color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}>Admin Dashboard</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0' }}>System & Sortiment</h1>
        <p className="lede" style={{ color: '#6b7280' }}>
          Pflege das Sortiment und prüfe API sowie Datenbank über die Health-Endpunkte.
        </p>
      </section>

      <AdminStatus />

      {/* Admin Layout: Grid Split */}
      <section className="admin-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '3rem', alignItems: 'start' }}>
        
        {/* Links: Sticky Formular */}
        <div style={{ position: 'sticky', top: '5.5rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
          <form className="admin-form" onSubmit={(event) => void submitProduct(event)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="section-title compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
              <div>
                <p className="eyebrow" style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>{isEditing ? 'Bearbeiten' : 'Neu'}</p>
                <h2 style={{ fontSize: '1.125rem', margin: 0 }}>{isEditing ? 'Produkt aktualisieren' : 'Produkt anlegen'}</h2>
              </div>
              {isEditing ? (
                <button type="button" onClick={resetForm} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                  Abbrechen
                </button>
              ) : null}
            </div>

            {notice ? <NoticeMessage notice={notice} /> : null}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
              Name
              <input
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="AStA Hoodie"
                type="text"
                value={form.name}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
              Beschreibung
              <textarea
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                placeholder="Kurzbeschreibung fuer die Shopkarte"
                rows={3}
                value={form.description}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem', resize: 'vertical' }}
              />
            </label>

            <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
                Preis in EUR
                <input
                  inputMode="decimal"
                  onChange={(event) => setForm({ ...form, priceEuro: event.target.value })}
                  placeholder="12.99"
                  type="text"
                  value={form.priceEuro}
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </label>
              <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
                Bestand
                <input
                  inputMode="numeric"
                  min="0"
                  onChange={(event) => setForm({ ...form, amountInStock: event.target.value })}
                  type="number"
                  value={form.amountInStock}
                  style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
                />
              </label>
            </div>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
              Bildpfad
              <input
                onChange={(event) => setForm({ ...form, imagePath: event.target.value })}
                placeholder="/images/products/hoodie.png"
                type="text"
                value={form.imagePath}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold', color: '#374151' }}>
              Tag
              <input
                onChange={(event) => setForm({ ...form, tag: event.target.value })}
                placeholder="clothing"
                type="text"
                value={form.tag}
                style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '0.375rem' }}
              />
            </label>

            {isEditing ? (
              <p className="form-id" style={{ fontSize: '0.75rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '0.25rem' }}>
                ID: {form.publicId}<br />
                Status: {formatProductStatus(form.status)}
              </p>
            ) : null}

            <button 
              className="primary-button" 
              disabled={saving} 
              type="submit"
              style={{ marginTop: '0.5rem', padding: '0.75rem', backgroundColor: '#111827', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: saving ? 'wait' : 'pointer' }}
            >
              {saving ? 'Speichern...' : isEditing ? 'Produkt aktualisieren' : 'Produkt anlegen'}
            </button>
          </form>
        </div>

        {/* Rechts: Produktliste */}
        <section className="admin-products" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
          <div className="section-title compact" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <div>
              <p className="eyebrow" style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Sortiment</p>
              <h2 style={{ fontSize: '1.25rem', margin: 0 }}>Produkte verwalten</h2>
            </div>
            <button type="button" onClick={() => void onRefreshProducts()} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#fff', cursor: 'pointer' }}>
              Neu laden
            </button>
          </div>

          {productsLoading ? <StateMessage title="Produkte werden geladen..." /> : null}
          {productsError ? <StateMessage tone="error" title={productsError} /> : null}
          {!productsLoading && !productsError && products.length === 0 ? (
            <StateMessage title="Noch keine Produkte vorhanden" />
          ) : null}

          <div className="admin-list" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {products.map((product) => (
              <article className="admin-row" key={product.publicId ?? product.name} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', border: '1px solid #f3f4f6', borderRadius: '0.75rem', transition: 'border-color 0.2s' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#f9fafb', flexShrink: 0 }}>
                  <ProductImage imagePath={product.imagePath} name={product.name} />
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h3 style={{ fontSize: '0.875rem', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{product.name || 'Unbenannt'}</h3>
                    <span style={{ fontSize: '0.65rem', fontWeight: 'bold', padding: '0.125rem 0.375rem', borderRadius: '999px', backgroundColor: product.status === 'ACTIVE' ? '#d1fae5' : '#fee2e2', color: product.status === 'ACTIVE' ? '#065f46' : '#991b1b' }}>
                      {formatProductStatus(product.status)}
                    </span>
                  </div>
                  <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.25rem 0' }}>{formatPrice(product.price)} · {product.amountInStock} auf Lager</p>
                </div>
                
                <div className="row-actions" style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
                  <button type="button" onClick={() => editProduct(product)} style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#fff', cursor: 'pointer' }}>
                    Edit
                  </button>
                  <button
                    disabled={saving || product.status === 'INACTIVE'}
                    type="button"
                    onClick={() => void setInactiveProduct(product)}
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem', fontWeight: 'bold', border: 'none', borderRadius: '0.375rem', backgroundColor: '#fee2e2', color: '#ef4444', cursor: (saving || product.status === 'INACTIVE') ? 'not-allowed' : 'pointer', opacity: (saving || product.status === 'INACTIVE') ? 0.5 : 1 }}
                  >
                    Inaktiv
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      </section>
    </div>
  )
}

function AdminStatus() {
  const [statuses, setStatuses] = useState<EndpointStatus[]>([])
  const [loading, setLoading] = useState(true)

  const loadStatuses = useCallback(async () => {
    setLoading(true)
    const nextStatuses = await Promise.all([
      checkApiHealth(),
      checkActuatorHealth(),
      checkDatabaseHealth(),
    ])
    setStatuses(nextStatuses)
    setLoading(false)
  }, [])

  useEffect(() => {
    queueMicrotask(() => {
      void loadStatuses()
    })
  }, [loadStatuses])

  return (
    <section className="section-band status-section" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
      <div className="section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <p className="eyebrow" style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold' }}>Überwachung</p>
          <h2 style={{ fontSize: '1.25rem', margin: 0 }}>System- & API-Status</h2>
        </div>
        <button type="button" onClick={() => void loadStatuses()} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', border: '1px solid #d1d5db', borderRadius: '0.375rem', backgroundColor: '#fff', cursor: 'pointer' }}>
          Neu prüfen
        </button>
      </div>

      {loading ? <StateMessage title="Status wird geladen..." /> : null}
      <div className="status-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {statuses.map((status) => (
          <article className="status-card" key={status.label} style={{ padding: '1rem', border: '1px solid #f3f4f6', borderRadius: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '0.3rem', backgroundColor: status.status === 'UP' ? '#10b981' : '#ef4444', flexShrink: 0 }} />
            <div>
              <h3 style={{ fontSize: '0.875rem', margin: '0 0 0.25rem 0' }}>{status.label}</h3>
              <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#6b7280', margin: '0 0 0.5rem 0' }}>{status.path}</p>
              <small style={{ fontSize: '0.75rem', color: '#4b5563', display: 'block' }}>
                HTTP {status.httpStatus ?? 'n/a'} · {formatDateTime(status.checkedAt)}
              </small>
              {status.details ? <small style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: '0.25rem', display: 'block' }}>{status.details}</small> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProductImage({
  imagePath,
  name,
}: {
  imagePath: string
  name: string
}) {
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  const failed = failedImagePath === imagePath

  if (!imagePath || failed) {
    return <div className="image-placeholder" style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '2rem', fontWeight: 900 }}>{name ? name.slice(0, 2).toUpperCase() : 'AS'}</div>
  }

  return <img alt={name} className="product-image" onError={() => setFailedImagePath(imagePath)} src={imagePath} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

function NoticeMessage({ notice }: { notice: Notice }) {
  const bgColors = { error: '#fee2e2', success: '#d1fae5', info: '#e0e7ff' }
  const textColors = { error: '#991b1b', success: '#065f46', info: '#3730a3' }
  return (
    <p style={{ padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.875rem', fontWeight: 'bold', margin: 0, backgroundColor: bgColors[notice.kind], color: textColors[notice.kind] }}>
      {notice.text}
    </p>
  )
}

function StateMessage({
  text,
  title,
  tone = 'neutral',
}: {
  text?: string
  title: string
  tone?: 'neutral' | 'error'
}) {
  const isError = tone === 'error'
  return (
    <div style={{ padding: '1.5rem', textAlign: 'center', borderRadius: '0.75rem', backgroundColor: isError ? '#fee2e2' : '#f9fafb', color: isError ? '#991b1b' : '#374151', border: `1px solid ${isError ? '#fecaca' : '#f3f4f6'}` }}>
      <strong style={{ display: 'block', fontSize: '1rem' }}>{title}</strong>
      {text ? <span style={{ display: 'block', fontSize: '0.875rem', marginTop: '0.5rem', color: isError ? '#b91c1c' : '#6b7280' }}>{text}</span> : null}
    </div>
  )
}

function getRoute(): Route {
  return window.location.pathname === '/admin/panel' ? 'admin' : 'shop'
}

function getOrCreateAnalyticsId() {
  const existing = localStorage.getItem(ANALYTICS_STORAGE_KEY)

  if (existing) {
    return existing
  }

  const nextId =
    typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`

  localStorage.setItem(ANALYTICS_STORAGE_KEY, nextId)
  return nextId
}

function formatPrice(priceInCent: number) {
  return new Intl.NumberFormat('de-DE', {
    currency: 'EUR',
    style: 'currency',
  }).format(priceInCent / 100)
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'short',
    timeStyle: 'medium',
  }).format(new Date(value))
}

function readError(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback
}

function isProductActive(product: ProductDTO) {
  return product.status === null || product.status === 'ACTIVE'
}

function formatProductStatus(status: ProductStatus | null) {
  if (status === 'ACTIVE') {
    return 'Aktiv'
  }

  if (status === 'INACTIVE') {
    return 'Inaktiv'
  }

  return 'Unbekannt'
}

function toProductForm(product: ProductDTO): ProductFormState {
  return {
    publicId: product.publicId,
    name: product.name,
    description: product.description,
    imagePath: product.imagePath,
    priceEuro: (product.price / 100).toFixed(2),
    amountInStock: String(product.amountInStock),
    tag: product.tag,
    status: product.status ?? 'ACTIVE',
  }
}

function parseEuroToCent(value: string) {
  const normalized = value.trim().replace(',', '.')
  const euroValue = Number(normalized)

  if (!Number.isFinite(euroValue)) {
    return null
  }

  return Math.round(euroValue * 100)
}

function validateProductForm(form: ProductFormState, isEditing: boolean) {
  if (isEditing && !form.publicId) {
    return 'Zum Aktualisieren fehlt die publicId.'
  }

  if (!form.name.trim()) {
    return 'Name ist erforderlich.'
  }

  const price = parseEuroToCent(form.priceEuro)
  if (price === null || price < 0) {
    return 'Preis muss eine Zahl ab 0 sein.'
  }

  const amountInStock = Number(form.amountInStock)
  if (!Number.isInteger(amountInStock) || amountInStock < 0) {
    return 'Bestand muss eine ganze Zahl ab 0 sein.'
  }

  return ''
}

function formToProduct(form: ProductFormState): ProductDTO {
  return {
    publicId: form.publicId,
    name: form.name.trim(),
    description: form.description.trim(),
    imagePath: form.imagePath.trim(),
    price: parseEuroToCent(form.priceEuro) ?? 0,
    amountInStock: Number(form.amountInStock),
    tag: form.tag.trim(),
    status: form.status,
  }
}

export default App