import React, { useCallback, useEffect, useState } from 'react'
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
  createOrder,
  type CartDTO,
  type EndpointStatus,
  type ProductDTO,
  type ProductStatus,
} from './api'
import './App.css'

const ANALYTICS_STORAGE_KEY = 'asta.analyticsId'
const ADMIN_PASSWORD = 'admin'

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

type CheckoutFormState = {
  name: string
  email: string
  pickupLocation: string
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

const emptyCheckoutForm: CheckoutFormState = {
  name: '',
  email: '',
  pickupLocation: 'ASTA_OFFICE',
}

let analyticsPosted = false

export default function App() {
  const [route, setRoute] = useState<Route>(() => window.location.pathname === '/admin/panel' ? 'admin' : 'shop')
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false)
  const [analyticsId, setAnalyticsId] = useState(getOrCreateAnalyticsId)
  const [products, setProducts] = useState<ProductDTO[]>([])
  const [productsLoading, setProductsLoading] = useState(true)
  const [productsError, setProductsError] = useState('')
  const [selectedProduct, setSelectedProduct] = useState<ProductDTO | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState('')
  const [cartItems, setCartItems] = useState<CartDTO[]>([])
  const [cartLoading, setCartLoading] = useState(true)
  const [cartError, setCartError] = useState('')
  
  const [isCheckoutView, setIsCheckoutView] = useState(false)
  const [checkoutForm, setCheckoutForm] = useState<CheckoutFormState>(emptyCheckoutForm)
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false)
  const [orderNotice, setOrderNotice] = useState<Notice | null>(null)

  const handleRouting = useCallback(() => {
    const currentPath = window.location.pathname
    if (currentPath === '/admin/panel') {
      if (isAdminAuthenticated) {
        setRoute('admin')
      } else {
        const password = window.prompt('Bitte Admin-Passwort eingeben:')
        if (password === ADMIN_PASSWORD) {
          setIsAdminAuthenticated(true)
          setRoute('admin')
        } else {
          alert('Falsches Passwort!')
          window.history.pushState({}, '', '/')
          setRoute('shop')
        }
      }
    } else {
      setRoute('shop')
    }
  }, [isAdminAuthenticated])

  useEffect(() => {
    if (window.location.pathname === '/admin/panel' && !isAdminAuthenticated) {
      handleRouting()
    }
    window.addEventListener('popstate', handleRouting)
    return () => window.removeEventListener('popstate', handleRouting)
  }, [handleRouting, isAdminAuthenticated])

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
    queueMicrotask(() => { void loadProducts() })
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
    queueMicrotask(() => { void loadCart() })
  }, [loadCart])

  function navigate(nextRoute: Route) {
    const path = nextRoute === 'admin' ? '/admin/panel' : '/'
    window.history.pushState({}, '', path)
    handleRouting()
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

  async function changeProductQuantity(publicProductId: string, currentAmount: number, delta: number) {
    const newAmount = currentAmount + delta
    setCartError('')
    if (newAmount <= 0) {
      await removeProductFromCart(publicProductId)
      return
    }
    try {
      await addToCart({
        analyticsId,
        publicProductId,
        amountSelected: delta, 
        status: 1,
      })
      await loadCart()
    } catch (error) {
      setCartError(readError(error, 'Menge konnte nicht angepasst werden.'))
    }
  }

  async function addProductToCart(product: ProductDTO) {
    if (!product.publicId) {
      setCartError('Dieses Produkt hat keine publicId.')
      return
    }
    const currentQty = cartItems
      .filter(item => item.publicProductId === product.publicId)
      .reduce((sum, item) => sum + item.amountSelected, 0)

    await changeProductQuantity(product.publicId, currentQty, 1)
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

  async function handleCheckoutSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!checkoutForm.name || !checkoutForm.email) {
      setOrderNotice({ kind: 'error', text: 'Bitte fülle alle Pflichtfelder aus.' })
      return
    }

    setIsSubmittingOrder(true)
    setOrderNotice(null)

    const groupedItems: Record<string, number> = {}
    cartItems.forEach((item) => {
      groupedItems[item.publicProductId] = (groupedItems[item.publicProductId] || 0) + item.amountSelected
    })

    const orderPayload = {
      items: Object.entries(groupedItems).map(([productId, quantity]) => ({
        productId,
        quantity,
      }))
    }

    try {
      await createOrder(orderPayload)
      const locationText = checkoutForm.pickupLocation === 'ASTA_OFFICE' ? 'AStA Büro (Hauptcampus)' : 'Info-Stand beim nächsten Campus-Event'
      setOrderNotice({ 
        kind: 'success', 
        text: `Vielen Dank, ${checkoutForm.name}! Deine Bestellung wurde übermittelt. Abholung hinterlegt für: ${locationText}. Eine Infomail wird an ${checkoutForm.email} gesendet.` 
      })
      
      analyticsPosted = false
      setAnalyticsId(createNewAnalyticsId())
      setCartItems([]) 
      setIsCheckoutView(false)
      setCheckoutForm(emptyCheckoutForm)
    } catch (error) {
      setOrderNotice({ kind: 'error', text: readError(error, 'Bestellung konnte nicht verarbeitet werden.') })
    } finally {
      setIsSubmittingOrder(false)
    }
  }

  const activeProducts = products.filter(isProductActive)

  return (
    <div className="app-shell" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f9fafb' }}>
      <Header route={route} navigate={navigate} />
      <main className="main-content" style={{ flex: '1', padding: '2rem' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          {route === 'admin' && isAdminAuthenticated ? (
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
              onChangeQuantity={changeProductQuantity}
              onSelectProduct={selectProduct}
              productCount={activeProducts.length}
              products={activeProducts}
              productsError={productsError}
              productsLoading={productsLoading}
              selectedProduct={selectedProduct}
              isSubmittingOrder={isSubmittingOrder}
              orderNotice={orderNotice}
              isCheckoutView={isCheckoutView}
              setIsCheckoutView={setIsCheckoutView}
              checkoutForm={checkoutForm}
              setCheckoutForm={setCheckoutForm}
              onCheckoutSubmit={handleCheckoutSubmit}
            />
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}

function Header({ route, navigate }: { route: Route; navigate: (nextRoute: Route) => void }) {
  return (
    <header className="topbar" style={{ position: 'sticky', top: 0, zIndex: 100, backgroundColor: '#fff', borderBottom: '1px solid #e5e7eb', boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)', width: '100%' }}>
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 2rem', height: '4.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', boxSizing: 'border-box' }}>
        <a 
          className="brand" 
          href="/" 
          onClick={(e) => { e.preventDefault(); navigate('shop') }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none', color: '#000000', opacity: route === 'shop' ? 1 : 0.8 }}
        >
          <span className="brand-mark" style={{ width: '3.2rem', height: '2.5rem', backgroundColor: '#008296', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0.5rem', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '0.05em' }}>BHH</span>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <strong style={{ fontSize: '1.125rem', lineHeight: '1.25rem', color: '#008296' }}>AStA Shop</strong>
            {route === 'admin' && <small style={{ color: '#6b7280', fontSize: '0.75rem', marginTop: '0.15rem' }}>Zurück zur Übersicht</small>}
          </div>
        </a>
        <nav className="topnav" aria-label="Hauptnavigation" style={{ display: 'flex', alignItems: 'center' }}>
          {route === 'admin' && (
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: '#008296', backgroundColor: '#e0f2f1', padding: '0.375rem 0.75rem', borderRadius: '0.375rem', border: '1px solid #b2dfdb' }}>
              Admin-Modus
            </span>
          )}
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer className="site-footer" style={{ marginTop: 'auto', padding: '2rem 1rem', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#6b7280', fontSize: '0.875rem', borderTop: '1px solid #e5e7eb', backgroundColor: '#fff' }}>
      <p>&copy; {new Date().getFullYear()} AStA Webshop. Alle Rechte vorbehalten.</p>
    </footer>
  )
}

interface ShopViewProps {
  analyticsId: string
  cartError: string
  cartItems: CartDTO[]
  cartLoading: boolean
  detailError: string
  detailLoading: boolean
  onAddToCart: (product: ProductDTO) => void
  onRefreshProducts: () => Promise<void>
  onRemoveFromCart: (id: string) => void
  onChangeQuantity: (id: string, current: number, delta: number) => void
  onSelectProduct: (id: string | null) => void
  productCount: number
  products: ProductDTO[]
  productsError: string
  productsLoading: boolean
  selectedProduct: ProductDTO | null
  isSubmittingOrder: boolean
  orderNotice: Notice | null
  isCheckoutView: boolean
  setIsCheckoutView: React.Dispatch<React.SetStateAction<boolean>>
  checkoutForm: CheckoutFormState
  setCheckoutForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>
  onCheckoutSubmit: (e: React.FormEvent) => void
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
  onChangeQuantity,
  onSelectProduct,
  productCount,
  products,
  productsError,
  productsLoading,
  selectedProduct,
  isSubmittingOrder,
  orderNotice,
  isCheckoutView,
  setIsCheckoutView,
  checkoutForm,
  setCheckoutForm,
  onCheckoutSubmit,
}: ShopViewProps) {
  
  const groupedCartItems: Record<string, { publicProductId: string; amountSelected: number }> = {}
  cartItems.forEach((item) => {
    if (groupedCartItems[item.publicProductId]) {
      groupedCartItems[item.publicProductId].amountSelected += item.amountSelected
    } else {
      groupedCartItems[item.publicProductId] = {
        publicProductId: item.publicProductId,
        amountSelected: item.amountSelected
      }
    }
  })
  const uniqueCartList = Object.values(groupedCartItems)
  const cartProductIds = new Set(uniqueCartList.map(item => item.publicProductId))

  const totalCartPrice = uniqueCartList.reduce((acc, item) => {
    const prod = products.find(p => p.publicId === item.publicProductId)
    return acc + (prod ? prod.price * item.amountSelected : 0)
  }, 0)

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2rem', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {isCheckoutView ? (
          <CheckoutForm 
            checkoutForm={checkoutForm} 
            setCheckoutForm={setCheckoutForm} 
            isSubmittingOrder={isSubmittingOrder} 
            onCheckoutSubmit={onCheckoutSubmit} 
            setIsCheckoutView={setIsCheckoutView} />
        ) : (
          <ProductGrid 
            products={products} 
            productsLoading={productsLoading} 
            productsError={productsError} 
            productCount={productCount} 
            cartProductIds={cartProductIds} 
            onRefreshProducts={onRefreshProducts} 
            onAddToCart={onAddToCart} 
            onSelectProduct={onSelectProduct} />
        )}
      </div>

      <aside style={{ position: 'sticky', top: '6rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '0.75rem', padding: '1.25rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>Session</p>
          <code style={{ fontSize: '0.75rem', display: 'block', marginTop: '0.5rem', padding: '0.375rem', backgroundColor: '#f3f4f6', borderRadius: '0.375rem', wordBreak: 'break-all', fontFamily: 'monospace' }}>
            {analyticsId || 'wird erstellt...'}
          </code>
        </div>

        <CartWidget 
          uniqueCartList={uniqueCartList} 
          products={products} 
          cartLoading={cartLoading} 
          cartError={cartError} 
          orderNotice={orderNotice} 
          totalCartPrice={totalCartPrice} 
          isCheckoutView={isCheckoutView} 
          setIsCheckoutView={setIsCheckoutView} 
          onChangeQuantity={onChangeQuantity} 
          onRemoveFromCart={onRemoveFromCart} />

        <DetailWidget 
          detailLoading={detailLoading} 
          detailError={detailError} 
          selectedProduct={selectedProduct} />
      </aside>
    </div>
  )
}

interface CheckoutFormProps {
  checkoutForm: CheckoutFormState
  setCheckoutForm: React.Dispatch<React.SetStateAction<CheckoutFormState>>
  isSubmittingOrder: boolean
  onCheckoutSubmit: (event: React.FormEvent) => Promise<void>
  setIsCheckoutView: React.Dispatch<React.SetStateAction<boolean>>
}

function CheckoutForm({ checkoutForm, setCheckoutForm, isSubmittingOrder, onCheckoutSubmit, setIsCheckoutView }: CheckoutFormProps) {
  return (
    <section style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '2.5rem', borderRadius: '1rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
      <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '1.5rem', color: '#000000' }}>Kontaktdaten &amp; Abholort</h2>
      <form onSubmit={(e) => { void onCheckoutSubmit(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontWeight: 'bold', fontSize: '0.875rem', color: '#374151' }}>
          Dein Name *
          <input type="text" required value={checkoutForm.name} onChange={e => setCheckoutForm(prev => ({...prev, name: e.target.value}))} style={{ padding: '0.65rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem' }} placeholder="Max Mustermann" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontWeight: 'bold', fontSize: '0.875rem', color: '#374151' }}>
          Studierenden-E-Mail *
          <input type="email" required value={checkoutForm.email} onChange={e => setCheckoutForm(prev => ({...prev, email: e.target.value}))} style={{ padding: '0.65rem', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '0.95rem' }} placeholder="max@stud.bhh.de" />
        </label>
        <label style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', fontWeight: 'bold', fontSize: '0.875rem', color: '#374151' }}>
          Wo möchtest du die Bestellung abholen?
          <select value={checkoutForm.pickupLocation} onChange={e => setCheckoutForm(prev => ({...prev, pickupLocation: e.target.value}))} style={{ padding: '0.65rem', border: '1px solid #d1d5db', borderRadius: '6px', backgroundColor: '#fff', fontSize: '0.95rem', cursor: 'pointer' }}>
            <option value="ASTA_OFFICE">AStA Büro (Hauptcampus)</option>
            <option value="CAMPUS_HALL_EVENT">Nächstes Campus-Event (Info-Stand)</option>
          </select>
        </label>
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
          <button type="submit" disabled={isSubmittingOrder} style={{ flex: 1, padding: '0.8rem', backgroundColor: '#00416a', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: isSubmittingOrder ? 'wait' : 'pointer', fontSize: '0.95rem' }}>
            {isSubmittingOrder ? 'Wird übermittelt...' : 'Kaufvorgang abschließen'}
          </button>
          <button type="button" onClick={() => setIsCheckoutView(false)} style={{ padding: '0.8rem 1.2rem', backgroundColor: '#fff', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '0.95rem', fontWeight: 500, color: '#374151' }}>
            Zurück
          </button>
        </div>
      </form>
    </section>
  )
}

interface ProductGridProps {
  products: ProductDTO[]
  productsLoading: boolean
  productsError: string
  productCount: number
  cartProductIds: Set<string>
  onRefreshProducts: () => Promise<void>
  onAddToCart: (product: ProductDTO) => void
  onSelectProduct: (publicId: string | null) => Promise<void>
}

function ProductGrid({ products, productsLoading, productsError, productCount, cartProductIds, onRefreshProducts, onAddToCart, onSelectProduct }: ProductGridProps) {
  return (
    <>
      <section style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '3rem', borderRadius: '1rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
        <p style={{ color: '#008296', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>Kollektion 2026</p>
        <h1 style={{ fontSize: '2.5rem', fontWeight: '900', marginTop: '0.5rem', marginBottom: '1rem', color: '#000000', letterSpacing: '-0.025em' }}>Dein Campus. Dein Style.</h1>
        <p style={{ color: '#4b5563', maxWidth: '600px', fontSize: '1.125rem' }}>Offizieller Merch der Beruflichen Hochschule Hamburg.</p>
        <div style={{ marginTop: '1.75rem', display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <button type="button" onClick={() => { void onRefreshProducts() }} style={{ padding: '0.625rem 1.25rem', background: '#fff', border: '1px solid #d1d5db', borderRadius: '0.5rem', cursor: 'pointer', fontWeight: 500, fontSize: '0.875rem', color: '#374151' }}>
            Kollektion aktualisieren
          </button>
          <small style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{productCount} Artikel verfügbar</small>
        </div>
      </section>
      <section>
        {productsLoading && <StateMessage title="Produkte werden geladen..." />}
        {productsError && <StateMessage tone="error" title={productsError} />}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {products.map((product: ProductDTO) => (
            <ProductCard
              key={product.publicId ?? product.name}
              isInCart={product.publicId ? cartProductIds.has(product.publicId) : false}
              onAddToCart={() => onAddToCart(product)}
              onSelect={() => { void onSelectProduct(product.publicId) }}
              product={product} />
          ))}
        </div>
      </section>
    </>
  )
}

interface CartWidgetProps {
  uniqueCartList: Array<{ publicProductId: string; amountSelected: number }>
  products: ProductDTO[]
  cartLoading: boolean
  cartError: string
  orderNotice: Notice | null
  totalCartPrice: number
  isCheckoutView: boolean
  setIsCheckoutView: React.Dispatch<React.SetStateAction<boolean>>
  onChangeQuantity: (id: string, current: number, delta: number) => Promise<void>
  onRemoveFromCart: (id: string) => Promise<void>
}

function CartWidget({ uniqueCartList, products, cartLoading, cartError, orderNotice, totalCartPrice, isCheckoutView, setIsCheckoutView, onChangeQuantity, onRemoveFromCart }: CartWidgetProps) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.04), 0 2px 4px -1px rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', minHeight: '300px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: '#000000' }}>Warenkorb</h2>
        <span style={{ backgroundColor: '#008296', color: '#fff', fontSize: '0.75rem', fontWeight: 'bold', padding: '0.25rem 0.625rem', borderRadius: '999px' }}>
          {uniqueCartList.length}
        </span>
      </div>
      {orderNotice && <NoticeMessage notice={orderNotice} />}
      {cartLoading && <StateMessage title="Lädt..." />}
      {cartError && <StateMessage tone="error" title={cartError} />}
      {!cartLoading && uniqueCartList.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}>
          <CartList cartItems={uniqueCartList} onRemoveFromCart={onRemoveFromCart} onChangeQuantity={onChangeQuantity} products={products} />
          <div style={{ borderTop: '1px solid #e5e7eb', marginTop: '1.5rem', paddingTop: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.25rem', fontSize: '1.05rem' }}>
              <span style={{ color: '#4b5563' }}>Gesamtsumme:</span>
              <strong style={{ color: '#000000', fontWeight: 800 }}>{formatPrice(totalCartPrice)}</strong>
            </div>
            {!isCheckoutView && (
              <button type="button" onClick={() => setIsCheckoutView(true)} style={{ width: '100%', padding: '0.85rem', backgroundColor: '#00416a', color: '#fff', border: 'none', borderRadius: '0.5rem', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.95rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                Zur Kasse gehen →
              </button>
            )}
          </div>
        </div>
      ) : (
        <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '3rem 0', margin: 'auto' }}>Dein Warenkorb ist leer.</p>
      )}
    </div>
  )
}

interface DetailWidgetProps {
  detailLoading: boolean
  detailError: string
  selectedProduct: ProductDTO | null
}

function DetailWidget({ detailLoading, detailError, selectedProduct }: DetailWidgetProps) {
  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
      <h2 style={{ fontSize: '1.125rem', fontWeight: 800, margin: 0, borderBottom: '1px solid #e5e7eb', paddingBottom: '0.75rem', marginBottom: '1rem', color: '#000000' }}>Details</h2>
      {detailLoading && <StateMessage title="Lädt..." />}
      {detailError && <StateMessage tone="error" title={detailError} />}
      {!detailLoading && !detailError && selectedProduct ? <ProductDetail product={selectedProduct} /> : <p style={{ color: '#6b7280', fontSize: '0.875rem', textAlign: 'center', padding: '1.5rem 0', margin: 0 }}>Wähle ein Produkt für Details.</p>}
    </div>
  )
}

function ProductCard({ isInCart, onAddToCart, onSelect, product }: { isInCart: boolean; onAddToCart: () => void; onSelect: () => void; product: ProductDTO }) {
  return (
    <article className="product-card" style={{ display: 'flex', flexDirection: 'column', border: '1px solid #e5e7eb', borderRadius: '1rem', overflow: 'hidden', backgroundColor: '#fff', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }} onClick={onSelect}>
      <div style={{ height: '220px', backgroundColor: '#f9fafb' }}>
        <ProductImage imagePath={product.imagePath} name={product.name} />
      </div>
      <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', flex: 1 }}>
        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#008296', marginBottom: '0.35rem', letterSpacing: '0.05em' }}>{product.tag || 'ohne Tag'}</p>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 700, margin: '0 0 0.5rem 0', color: '#000000' }}>{product.name || 'Unbenannt'}</h3>
        <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <strong style={{ fontSize: '1.35rem', fontWeight: '900', color: '#000000' }}>{formatPrice(product.price)}</strong>
          <span style={{ fontSize: '0.75rem', color: '#6b7280', backgroundColor: '#f3f4f6', padding: '0.25rem 0.5rem', borderRadius: '0.375rem' }}>{product.amountInStock} auf Lager</span>
        </div>
        <button className="primary-button" disabled={isInCart} type="button" onClick={(e) => { e.stopPropagation(); onAddToCart(); }} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', fontWeight: 'bold', backgroundColor: isInCart ? '#f3f4f6' : '#00416a', color: isInCart ? '#9ca3af' : '#fff', border: 'none', cursor: isInCart ? 'not-allowed' : 'pointer', fontSize: '0.9rem' }}>
          {isInCart ? 'Im Warenkorb ✓' : 'Hinzufügen +'}
        </button>
      </div>
    </article>
  )
}

interface CartListProps {
  cartItems: Array<{ publicProductId: string; amountSelected: number }>
  onRemoveFromCart: (id: string) => Promise<void>
  onChangeQuantity: (id: string, current: number, delta: number) => Promise<void>
  products: ProductDTO[]
}

function CartList({ cartItems, onRemoveFromCart, onChangeQuantity, products }: CartListProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      {cartItems.map((item, index) => {
        const product = products.find(entry => entry.publicId === item.publicProductId)
        const title = product?.name ?? item.publicProductId
        return (
          <article key={`${item.publicProductId}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', backgroundColor: '#f9fafb', borderRadius: '0.5rem', border: '1px solid #e5e7eb' }}>
            <div style={{ flex: 1, marginRight: '0.5rem' }}>
              <h3 style={{ fontSize: '0.875rem', margin: 0, fontWeight: 700, color: '#000000' }}>{title}</h3>
              <p style={{ fontSize: '0.75rem', color: '#6b7280', margin: '0.125rem 0' }}>
                {product ? formatPrice(product.price * item.amountSelected) : ''}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.35rem' }}>
                <button type="button" onClick={(e) => { e.stopPropagation(); void onChangeQuantity(item.publicProductId, item.amountSelected, -1) }} style={{ padding: '1px 6px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>-</button>
                <span style={{ fontSize: '0.875rem', fontWeight: 'bold', color: '#000000', minWidth: '1rem', textAlign: 'center' }}>{item.amountSelected}</span>
                <button type="button" onClick={(e) => { e.stopPropagation(); void onChangeQuantity(item.publicProductId, item.amountSelected, 1) }} style={{ padding: '1px 6px', border: '1px solid #d1d5db', background: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.75rem' }}>+</button>
              </div>
            </div>
            <button type="button" onClick={(e) => { e.stopPropagation(); void onRemoveFromCart(item.publicProductId) }} style={{ padding: '0.25rem 0.5rem', fontSize: '0.725rem', color: '#ef4444', backgroundColor: '#fee2e2', border: 'none', borderRadius: '0.375rem', cursor: 'pointer', fontWeight: 600 }}>
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ height: '150px', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#f3f4f6' }}>
        <ProductImage imagePath={product.imagePath} name={product.name} />
      </div>
      <div>
        <p style={{ fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 800, color: '#008296', margin: 0 }}>{product.tag || 'ohne Tag'}</p>
        <h3 style={{ fontSize: '1.125rem', fontWeight: 800, margin: '0.25rem 0', color: '#000000' }}>{product.name}</h3>
        <p style={{ fontSize: '0.85rem', color: '#4b5563', lineHeight: 1.4, marginBottom: '0.75rem' }}>{product.description || 'Keine Beschreibung hinterlegt.'}</p>
        <div style={{ fontSize: '0.7rem', backgroundColor: '#f3f4f6', padding: '0.5rem', borderRadius: '0.375rem', fontFamily: 'monospace', color: '#6b7280' }}>
          ID: {product.publicId?.slice(0, 8) ?? 'n/a'}
        </div>
      </div>
    </div>
  )
}

interface AdminPanelProps {
  onRefreshProducts: () => Promise<void>
  products: ProductDTO[]
  productsError: string
  productsLoading: boolean
}

function AdminPanel({ onRefreshProducts, products, productsError, productsLoading }: AdminPanelProps) {
  const [form, setForm] = useState<ProductFormState>(emptyProductForm)
  const [notice, setNotice] = useState<Notice | null>(null)
  const [saving, setSaving] = useState(false)
  const isEditing = Boolean(form.publicId)

  const editProduct = (product: ProductDTO) => {
    setForm({
      publicId: product.publicId,
      name: product.name,
      description: product.description,
      imagePath: product.imagePath,
      priceEuro: (product.price / 100).toFixed(2),
      amountInStock: String(product.amountInStock),
      tag: product.tag,
      status: product.status ?? 'ACTIVE',
    })
    setNotice({ kind: 'info', text: 'Produkt ist im Formular geladen.' })
  }

  const resetForm = () => {
    setForm(emptyProductForm)
    setNotice(null)
  }

  const submitProduct = async (event: React.FormEvent) => {
    event.preventDefault()
    const validationError = validateProductForm(form, isEditing)
    if (validationError) {
      setNotice({ kind: 'error', text: validationError })
      return
    }

    setSaving(true)
    setNotice(null)

    const payload: ProductDTO = {
      publicId: form.publicId,
      name: form.name.trim(),
      description: form.description.trim(),
      imagePath: form.imagePath.trim(),
      price: Math.round(Number(form.priceEuro.replace(',', '.')) * 100) || 0,
      amountInStock: Number(form.amountInStock),
      tag: form.tag.trim(),
      status: form.status,
    }

    try {
      if (isEditing) {
        await updateProduct(payload)
        setNotice({ kind: 'success', text: 'Produkt wurde aktualisiert.' })
      } else {
        await addProduct(payload)
        setNotice({ kind: 'success', text: 'Produkt wurde angelegt.' })
        setForm(emptyProductForm)
      }
      await onRefreshProducts()
    } catch (error) {
      setNotice({ kind: 'error', text: readError(error, 'Fehler beim Speichern.') })
    } finally {
      setSaving(false)
    }
  }

  const setInactive = async (product: ProductDTO) => {
    if (!product.publicId) return
    setSaving(true)
    try {
      await setProductInactive(product.publicId)
      setNotice({ kind: 'success', text: 'Produkt ist jetzt inaktiv.' })
      await onRefreshProducts()
    } catch (error) {
      setNotice({ kind: 'error', text: readError(error, 'Fehler beim Deaktivieren.') })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="page-grid admin-page" style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
      <section className="admin-head" style={{ borderBottom: '1px solid #e5e7eb', paddingBottom: '2rem' }}>
        <p className="eyebrow" style={{ color: '#008296', fontWeight: 'bold', textTransform: 'uppercase', fontSize: '0.75rem' }}>Admin Dashboard</p>
        <h1 style={{ fontSize: '2rem', fontWeight: 900, margin: '0.5rem 0', color: '#000000' }}>System &amp; Sortiment</h1>
        <p className="lede" style={{ color: '#6b7280' }}>Pflege das Sortiment und prüfe API sowie..."</p>
      </section>

      <AdminStatus />

      <section className="admin-layout" style={{ display: 'grid', gridTemplateColumns: '350px 1fr', gap: '3rem', alignItems: 'start' }}>
        <div style={{ position: 'sticky', top: '6rem', backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
          <form onSubmit={(e) => { void submitProduct(e) }} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem' }}>
              <div>
                <p style={{ fontSize: '0.65rem', color: '#6b7280', textTransform: 'uppercase', fontWeight: 'bold', margin: 0 }}>{isEditing ? 'Bearbeiten' : 'Neu'}</p>
                <h2 style={{ fontSize: '1.125rem', margin: 0, color: '#000000' }}>{isEditing ? 'Produkt aktualisieren' : 'Produkt anlegen'}</h2>
              </div>
              {isEditing && (
                <button type="button" onClick={resetForm} style={{ fontSize: '0.75rem', color: '#6b7280', border: 'none', background: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Abbrechen</button>
              )}
            </div>

            {notice && <NoticeMessage notice={notice} />}

            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Name<input type="text" value={form.name} onChange={e => setForm(prev => ({...prev, name: e.target.value}))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Beschreibung<textarea value={form.description} onChange={e => setForm(prev => ({...prev, description: e.target.value}))} rows={3} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} /></label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Preis (€)<input type="text" value={form.priceEuro} onChange={e => setForm(prev => ({...prev, priceEuro: e.target.value}))} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} /></label>
              <label style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Bestand<input type="number" value={form.amountInStock} onChange={e => setForm(prev => ({...prev, amountInStock: e.target.value}))} style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} /></label>
            </div>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Bildpfad<input type="text" value={form.imagePath} onChange={e => setForm(prev => ({...prev, imagePath: e.target.value}))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} /></label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', fontSize: '0.75rem', fontWeight: 'bold' }}>Tag<input type="text" value={form.tag} onChange={e => setForm(prev => ({...prev, tag: e.target.value}))} style={{ padding: '0.5rem', border: '1px solid #d1d5db', borderRadius: '4px' }} /></label>

            <button type="submit" disabled={saving} style={{ padding: '0.75rem', background: '#00416a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
              {saving ? 'Speichern...' : isEditing ? 'Produkt aktualisieren' : 'Produkt anlegen'}
            </button>
          </form>
        </div>

        <section style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', padding: '1.5rem', borderRadius: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ color: '#000000' }}>Produkte verwalten</h2>
            <button type="button" onClick={() => { void onRefreshProducts() }} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Neu laden</button>
          </div>
          {productsLoading && <StateMessage title="Produkte werden geladen..." />}
          {productsError && <StateMessage tone="error" title={productsError} />}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {products.map((product: ProductDTO) => (
              <div key={product.publicId ?? product.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', border: '1px solid #f3f4f6', borderRadius: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden' }}><ProductImage imagePath={product.imagePath} name={product.name} /></div>
                  <div>
                    <strong style={{ color: '#000000' }}>{product.name}</strong>
                    <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', padding: '2px 6px', borderRadius: '10px', background: product.status === 'ACTIVE' ? '#e0f2f1' : '#fee2e2', color: product.status === 'ACTIVE' ? '#008296' : '#991b1b' }}>{product.status}</span>
                    <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatPrice(product.price)} · {product.amountInStock} auf Lager</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" onClick={() => editProduct(product)} style={{ padding: '4px 8px', cursor: 'pointer' }}>Edit</button>
                  <button type="button" disabled={product.status === 'INACTIVE'} onClick={() => { void setInactive(product) }} style={{ padding: '4px 8px', background: '#fee2e2', color: '#ef4444', border: 'none', cursor: 'pointer' }}>Inaktiv</button>
                </div>
              </div>
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
    const nextStatuses = await Promise.all([checkApiHealth(), checkActuatorHealth(), checkDatabaseHealth()])
    setStatuses(nextStatuses)
    setLoading(false)
  }, [])

  useEffect(() => { queueMicrotask(() => { void loadStatuses() }) }, [loadStatuses])

  return (
    <section className="section-band status-section" style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '1rem', padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0', color: '#000000' }}>System- &amp; API-Status</h2>
        <button type="button" onClick={() => { void loadStatuses() }} style={{ padding: '0.5rem 1rem', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}>Neu prüfen</button>
      </div>
      {loading && <StateMessage title="Status wird geladen..." />}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
        {statuses.map((status) => (
          <article key={status.label} style={{ padding: '1rem', border: '1px solid #f3f4f6', borderRadius: '0.75rem', display: 'flex', gap: '1rem' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', marginTop: '0.3rem', backgroundColor: status.status === 'UP' ? '#10b981' : '#ef4444' }} />
            <div>
              <h3 style={{ fontSize: '0.875rem', margin: 0, color: '#000000' }}>{status.label}</h3>
              <p style={{ fontSize: '0.65rem', fontFamily: 'monospace', color: '#6b7280', margin: '0.25rem 0' }}>{status.path}</p>
              <small style={{ fontSize: '0.75rem', color: '#4b5563' }}>HTTP {status.httpStatus ?? 'n/a'}</small>
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

function ProductImage({ imagePath, name }: { imagePath: string; name: string }) {
  const [failedImagePath, setFailedImagePath] = useState<string | null>(null)
  if (!imagePath || failedImagePath === imagePath) {
    return <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f3f4f6', color: '#9ca3af', fontSize: '2rem', fontWeight: '900' }}>{name ? name.slice(0, 2).toUpperCase() : 'AS'}</div>
  }
  return <img alt={name} onError={() => setFailedImagePath(imagePath)} src={imagePath} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
}

function isProductActive(product: ProductDTO) { return product.status === null || product.status === 'ACTIVE' }
function createNewAnalyticsId() { const nextId = crypto.randomUUID(); localStorage.setItem(ANALYTICS_STORAGE_KEY, nextId); return nextId; }
function getOrCreateAnalyticsId() { const existing = localStorage.getItem(ANALYTICS_STORAGE_KEY); if (existing) return existing; return createNewAnalyticsId(); }
function formatPrice(p: number) { return new Intl.NumberFormat('de-DE', { currency: 'EUR', style: 'currency' }).format(p / 100) }
function readError(e: unknown, fallback: string) { return e instanceof Error ? e.message : fallback }
function parseEuroToCent(v: string) { const n = v.trim().replace(',', '.'); const e = Number(n); return !Number.isFinite(e) ? null : Math.round(e * 100) }
function validateProductForm(f: ProductFormState, e: boolean) { if (e && !f.publicId) return 'Fehlt publicId.'; if (!f.name.trim()) return 'Name fehlt.'; const p = parseEuroToCent(f.priceEuro); if (p === null || p < 0) return 'Preis fehlerhaft.'; if (Number(f.amountInStock) < 0) return 'Bestand fehlerhaft.'; return '' }
function NoticeMessage({ notice }: { notice: Notice }) { return <p style={{ padding: '0.75rem', borderRadius: '0.5rem', backgroundColor: notice.kind === 'success' ? '#e0f2f1' : notice.kind === 'error' ? '#fee2e2' : '#e0e7ff', color: notice.kind === 'success' ? '#008296' : notice.kind === 'error' ? '#991b1b' : '#3730a3', fontWeight: 'bold', margin: '0 0 1rem 0', fontSize: '0.875rem' }}>{notice.text}</p> }
function StateMessage({ title, tone }: { title: string; tone?: string }) { return <div style={{ padding: '1rem', background: tone === 'error' ? '#fee2e2' : '#f9fafb', color: tone === 'error' ? '#991b1b' : 'inherit', textAlign: 'center', borderRadius: '8px' }}>{title}</div> }