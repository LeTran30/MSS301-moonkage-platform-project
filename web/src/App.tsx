import { NfcVerification } from './components/NfcVerification'

export function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-indigo-50/40 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-2xl">
        <NfcVerification />
      </div>
    </div>
  )
}

export default App
