declare global {
  interface Window {
    naver: any
  }
}

function waitForGeocoder(timeoutMs = 10000): Promise<boolean> {
  if (window.naver?.maps?.Service) return Promise.resolve(true)
  return new Promise((resolve) => {
    const timer = setInterval(() => {
      if (window.naver?.maps?.Service) {
        clearInterval(timer)
        resolve(true)
      }
    }, 100)
    setTimeout(() => {
      clearInterval(timer)
      resolve(!!window.naver?.maps?.Service)
    }, timeoutMs)
  })
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!address.trim()) return null
  const ready = await waitForGeocoder()
  if (!ready) return null

  return new Promise((resolve) => {
    window.naver.maps.Service.geocode({ query: address }, (status: string, response: any) => {
      if (status !== window.naver.maps.Service.Status.OK || !response?.v2?.addresses?.length) {
        resolve(null)
        return
      }
      const { x, y } = response.v2.addresses[0]
      resolve({ lat: Number(y), lng: Number(x) })
    })
  })
}
