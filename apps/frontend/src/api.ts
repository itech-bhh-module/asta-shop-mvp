export type ProductStatus = 'ACTIVE' | 'INACTIVE'

export type ProductDTO = {
  publicId: string | null
  name: string
  description: string
  imagePath: string
  price: number
  amountInStock: number
  tag: string
  status: ProductStatus | null
}

export type ProductEntity = ProductDTO & {
  productId: number
  publicId: string
}

export type CartDTO = {
  analyticsId: string
  publicProductId: string
  amountSelected: number
  status: number
}

export type CartEntity = {
  cartId: number
  sessionId: number
  productId: number
  amountSelected: number
  status: number
}

export type SessionDTO = {
  analyticsId: string
  loginTimestamp: string
}

export type SessionEntity = {
  sessionId: number
  analytics_id: string
  loginTimestamp: string
}

export type ActuatorComponent = {
  status?: string
  details?: unknown
  components?: Record<string, ActuatorComponent>
}

export type ActuatorHealth = ActuatorComponent & {
  components?: Record<string, ActuatorComponent>
}

export type EndpointStatus = {
  label: string
  path: string
  status: string
  httpStatus?: number
  checkedAt: string
  details?: string
}

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api'
const API_BASE_URL = "http://localhost:8081/api"

async function requestJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    ...init,
  })

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`)
  }

  const text = await response.text()
  return text ? (JSON.parse(text) as T) : (null as T)
}

async function checkEndpoint(
  label: string,
  path: string,
): Promise<EndpointStatus> {
  const checkedAt = new Date().toISOString()

  try {
    const response = await fetch(`${API_BASE_URL}${path}`)
    return {
      label,
      path,
      status: response.ok ? 'UP' : 'DOWN',
      httpStatus: response.status,
      checkedAt,
    }
  } catch (error) {
    return {
      label,
      path,
      status: 'DOWN',
      checkedAt,
      details: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

export function getProducts() {
  return requestJson<ProductDTO[]>('/product/getProducts')
}

export function getProduct(publicId: string) {
  return requestJson<ProductDTO | null>(`/product/getProduct/${publicId}`)
}

export function addProduct(product: Omit<ProductDTO, 'publicId'>) {
  return requestJson<ProductEntity>('/admin/addProduct', {
    method: 'POST',
    body: JSON.stringify({ ...product, publicId: null }),
  })
}

export function updateProduct(product: ProductDTO) {
  return requestJson<ProductDTO>('/admin/updateProduct', {
    method: 'PUT',
    body: JSON.stringify(product),
  })
}

export function setProductInactive(publicId: string) {
  return requestJson<ProductDTO>(`/product/setProductInactive/${publicId}`, {
    method: 'PATCH',
  })
}

export function postSession(session: SessionDTO) {
  return requestJson<SessionEntity>('/analytics/postSession', {
    method: 'POST',
    body: JSON.stringify(session),
  })
}

export function getCart(analyticsId: string) {
  return requestJson<CartDTO[]>(`/cart/getCart/${analyticsId}`)
}

export function addToCart(cartEntry: CartDTO) {
  return requestJson<CartEntity>('/cart/addToCart', {
    method: 'POST',
    body: JSON.stringify(cartEntry),
  })
}

export function removeFromCart(analyticsId: string, publicProductId: string) {
  return requestJson<CartDTO[]>(
    `/cart/removeFromCart/${analyticsId}/${publicProductId}`,
    {
      method: 'POST',
    },
  )
}

export function checkApiHealth() {
  return checkEndpoint('API', '/health/status')
}

export async function getActuatorHealth() {
  return requestJson<ActuatorHealth>('/actuator/health')
}

export async function checkActuatorHealth(): Promise<EndpointStatus> {
  const checkedAt = new Date().toISOString()

  try {
    const health = await getActuatorHealth()
    return {
      label: 'Actuator',
      path: '/actuator/health',
      status: health.status ?? 'UNKNOWN',
      httpStatus: 200,
      checkedAt,
    }
  } catch (error) {
    return {
      label: 'Actuator',
      path: '/actuator/health',
      status: 'DOWN',
      checkedAt,
      details: error instanceof Error ? error.message : 'Request failed',
    }
  }
}

export async function checkDatabaseHealth(): Promise<EndpointStatus> {
  const checkedAt = new Date().toISOString()

  try {
    const response = await fetch(`${API_BASE_URL}/actuator/health/db`)

    if (response.ok) {
      const health = (await response.json()) as ActuatorComponent
      return {
        label: 'Database',
        path: '/actuator/health/db',
        status: health.status ?? 'UNKNOWN',
        httpStatus: response.status,
        checkedAt,
      }
    }

    const health = await getActuatorHealth()
    const db = health.components?.db

    return {
      label: 'Database',
      path: '/actuator/health',
      status: db?.status ?? 'UNKNOWN',
      httpStatus: response.status,
      checkedAt,
      details: db
        ? 'Fallback aus Actuator-Gesamtstatus'
        : 'Keine db-Komponente im Actuator-Status gefunden',
    }
  } catch (error) {
    return {
      label: 'Database',
      path: '/actuator/health/db',
      status: 'DOWN',
      checkedAt,
      details: error instanceof Error ? error.message : 'Request failed',
    }
  }
}
