import LEDGradientRecorder from './LEDGradientRecorder'

function App() {

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg p-6">
          <div className="space-y-6">
            <div className="bg-gray-50 rounded-md p-4">
              <LEDGradientRecorder />
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default App
