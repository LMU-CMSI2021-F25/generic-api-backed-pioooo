import { useEffect, useRef, useState } from 'react'
import {
  AppBar,
  Toolbar,
  Stack,
  Button,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  CssBaseline,
  Box
} from '@mui/material'
import { ThemeProvider, createTheme } from '@mui/material/styles'
import RefreshIcon from '@mui/icons-material/Refresh'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import happy from './assets/happy.png'

const STORAGE_ADVICE = 'advice.daily'
const STORAGE_DATE = 'advice.date'

function useGoogleFonts() {
  useEffect(() => {
    const links = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossOrigin: 'anonymous' },
      {
        rel: 'stylesheet',
        href:
          'https://fonts.googleapis.com/css2?family=Epunda+Slab:ital,wght@0,300..900;1,300..900&family=Roboto+Mono:ital,wght@0,100..700;1,100..700&family=Story+Script&family=Ubuntu:ital,wght@0,300;0,400;0,500;0,700;1,300;1,400;1,500;1,700&display=swap'
      }
    ]
    const created = links.map(def => {
      const el = document.createElement('link')
      Object.entries(def).forEach(([k, v]) => el.setAttribute(k, v))
      document.head.appendChild(el)
      return el
    })
    return () => created.forEach(el => document.head.removeChild(el))
  }, [])
}

const theme = createTheme({
  palette: {
    primary: { main: '#2D3142' },
    secondary: { main: '#FF6663' },
    text: { primary: '#2D3142' }
  },
  typography: {
    fontFamily: '"Ubuntu","Roboto Mono",system-ui,-apple-system,Segoe UI,Arial,sans-serif'
  },
  shape: { borderRadius: 16 }
})

function App() {
  useGoogleFonts()

  const [advice, setAdvice] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const abortRef = useRef(null)

  const today = () => new Date().toISOString().slice(0, 10)

  const loadDailyFromStorage = () => {
    const d = localStorage.getItem(STORAGE_DATE)
    const a = localStorage.getItem(STORAGE_ADVICE)
    if (d === today() && a) {
      try {
        const parsed = JSON.parse(a)
        if (parsed && parsed.text) {
          setAdvice(parsed)
          return true
        }
      } catch {}
    }
    return false
  }

  const saveDaily = (text, id) => {
    const payload = { text, id }
    localStorage.setItem(STORAGE_ADVICE, JSON.stringify(payload))
    localStorage.setItem(STORAGE_DATE, today())
  }

  const startFetch = url => {
    if (abortRef.current) abortRef.current.abort()
    const ctrl = new AbortController()
    abortRef.current = ctrl
    setLoading(true)
    setError('')
    const withTs = `${url}${url.includes('?') ? '&' : '?'}ts=${Date.now()}`
    return fetch(withTs, {
      signal: ctrl.signal,
      cache: 'no-store',
      headers: { Accept: 'application/json' }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json()
      })
      .catch(e => {
        if (e.name !== 'AbortError') setError('Network error')
        return null
      })
      .finally(() => setLoading(false))
  }

  const fetchRandom = () => {
    startFetch('https://api.adviceslip.com/advice').then(data => {
      const text = data?.slip?.advice
      const id = data?.slip?.id
      if (text) {
        setAdvice({ text, id })
        saveDaily(text, id)
      } else {
        setError('No advice found')
      }
    })
  }

  const refreshAnyway = () => {
    localStorage.removeItem(STORAGE_DATE)
    fetchRandom()
  }

  const copyAdvice = () => {
    if (!advice) return
    navigator.clipboard
      .writeText(`"${advice.text}"`)
      .then(() => setCopied(true))
      .catch(() => setError('Copy failed'))
  }

  useEffect(() => {
    const hit = loadDailyFromStorage()
    if (!hit) fetchRandom()
    return () => abortRef.current?.abort()
  }, [])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100dvh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          overflowX: 'hidden'
        }}
      >
        <AppBar
          position="fixed"
          elevation={6}
          sx={{
            height: '120px',
            width: '100vw',
            left: 0,
            right: 0,
            justifyContent: 'center',
            backgroundImage:
              'linear-gradient(90deg,#2D3142 0%,#A09ABC 30%,#FF6663 70%,#2D3142 100%)'
          }}
        >
          <Toolbar sx={{ justifyContent: 'center' }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                color: '#fff',
                textShadow: '2px 2px 10px rgba(0,0,0,0.6)',
                fontFamily: '"Story Script",cursive'
              }}
            >
              Advice of the Day
            </Typography>
          </Toolbar>
        </AppBar>

        <Box
          sx={{
            flex: 1,
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            px: 2,
            pt: '120px',
            pb: '120px',
            backgroundImage:
              'linear-gradient(135deg,#B6A6CA 0%,#BDD9BF 40%,#A09ABC 70%,#FF6663 100%)',
            backgroundAttachment: 'scroll'
          }}
        >
          {loading && (
            <Stack spacing={1} alignItems="center">
              <CircularProgress />
              <Typography variant="body2">Fetching advice</Typography>
            </Stack>
          )}

          {!loading && advice && (
            <Card
              sx={{
                width: '100%',
                maxWidth: 640,
                textAlign: 'center',
                p: 2,
                boxShadow: '0 8px 30px rgba(0,0,0,0.25)',
                backgroundImage:
                  'linear-gradient(180deg,rgba(255,255,255,0.98) 0%,rgba(245,245,255,0.95) 50%,rgba(255,255,255,0.92) 100%)'
              }}
            >
              <CardContent>
                <Typography variant="overline" color="text.secondary">
                  {advice.id ? `Slip ${advice.id}` : 'Today'}
                </Typography>

                <Typography
                  variant="h4"
                  sx={{
                    mb: 2,
                    color: '#2D3142',
                    textShadow: '1px 1px 5px rgba(0,0,0,0.15)',
                    fontFamily: '"Epunda Slab",serif',
                    lineHeight: 1.3
                  }}
                >
                  “{advice.text}”
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Stack direction="row" spacing={2} justifyContent="center">
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={refreshAnyway}
                    startIcon={<RefreshIcon />}
                    sx={{
                      boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
                      textTransform: 'none',
                      fontWeight: 600
                    }}
                  >
                    Refresh
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={copyAdvice}
                    startIcon={<ContentCopyIcon />}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderColor: '#A09ABC',
                      color: '#2D3142'
                    }}
                  >
                    Copy
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Box>

        <Box
          component="footer"
          sx={{
            position: 'fixed',
            bottom: 0,
            height: '120px',
            width: '100vw',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            color: '#fff',
            backgroundImage:
              'linear-gradient(90deg,#2D3142 0%,#A09ABC 30%,#FF6663 70%,#2D3142 100%)',
            boxShadow: '0 -4px 25px rgba(0,0,0,0.35)',
            fontFamily: '"Epunda Slab",serif'
          }}
        >
          <img
            src={happy}
            alt="Happy"
            style={{ height: '60px', width: 'auto' }}
          />
          <Typography variant="body2">
            Built by Pio Ong Ante
          </Typography>
        </Box>

        <Snackbar open={!!error} autoHideDuration={3000} onClose={() => setError('')}>
          <Alert severity="error" onClose={() => setError('')}>{error}</Alert>
        </Snackbar>

        <Snackbar open={copied} autoHideDuration={2000} onClose={() => setCopied(false)}>
          <Alert severity="success" onClose={() => setCopied(false)}>Copied</Alert>
        </Snackbar>
      </Box>
    </ThemeProvider>
  )
}

export default App
