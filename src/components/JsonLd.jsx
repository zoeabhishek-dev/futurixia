import { useEffect } from "react"

// Adds one JSON-LD block to the page head. If the page's HTML already contains a block with the same id
// (the founder page does), that block is reused, so the same data is never added twice.
function JsonLd({ id, data }) {
  useEffect(() => {
    if (!data) return undefined

    let element = document.getElementById(id)
    if (!element) {
      element = document.createElement("script")
      element.type = "application/ld+json"
      element.id = id
      element.text = JSON.stringify(data)
      document.head.appendChild(element)
    }

    return () => {
      element.remove()
    }
  }, [id, data])

  return null
}

export default JsonLd
