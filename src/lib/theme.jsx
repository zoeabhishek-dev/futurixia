import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { supabase } from "../supabaseClient"
import { DEFAULT_THEME, themeById } from "./themes"

const ThemeContext = createContext({
  plan: null,
  theme: DEFAULT_THEME,
  canChoose: false,
  ready: false,
  setTheme: async () => ({ ok: false }),
})

function applyTheme(id, remember) {
  const chosen = themeById(id)
  document.documentElement.setAttribute("data-theme", chosen.id)

  const meta = document.querySelector('meta[name="theme-color"]')
  if (meta) meta.setAttribute("content", chosen.bg)

  try {
    if (remember) window.localStorage.setItem("fx_theme", chosen.id)
    else window.localStorage.removeItem("fx_theme")
  } catch (err) {
    // Storage can be blocked; the saved theme in Supabase still works.
  }
}

export function ThemeProvider({ children }) {
  const [state, setState] = useState({ plan: null, theme: DEFAULT_THEME, ready: false })

  const refresh = useCallback(async () => {
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData?.session) {
        applyTheme(DEFAULT_THEME, false)
        setState({ plan: null, theme: DEFAULT_THEME, ready: true })
        return
      }

      const { data, error } = await supabase.rpc("get_my_plan")
      const row = Array.isArray(data) ? data[0] : data

      if (error || !row) {
        setState((s) => ({ ...s, ready: true }))
        return
      }

      applyTheme(row.theme, true)
      setState({ plan: row.plan, theme: row.theme, ready: true })
    } catch (err) {
      setState((s) => ({ ...s, ready: true }))
    }
  }, [])

  useEffect(() => {
    refresh()

    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        applyTheme(DEFAULT_THEME, false)
        setState({ plan: null, theme: DEFAULT_THEME, ready: true })
      } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        setTimeout(refresh, 0)
      }
    })

    return () => listener.subscription.unsubscribe()
  }, [refresh])

  const setTheme = useCallback(async (id) => {
    const { error } = await supabase.rpc("set_my_theme", { p_theme: id })
    if (error) return { ok: false, message: error.message }
    applyTheme(id, true)
    setState((s) => ({ ...s, theme: id }))
    return { ok: true }
  }, [])

  const value = useMemo(
    () => ({
      plan: state.plan,
      theme: state.theme,
      ready: state.ready,
      canChoose: state.plan === "pro" || state.plan === "pro_max",
      setTheme,
    }),
    [state, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return useContext(ThemeContext)
}