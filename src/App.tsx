import 'src/styles.css';
import { ResponsiveWrapper } from 'src/components/ResponsiveWrapper'
import ThreadGPT from 'src/components/ThreadGPT/ThreadGPT'

const rootNode = 'root'

function App() {
  return (
    <ResponsiveWrapper>
      <h1>ThreadGPT</h1>
      <ThreadGPT nodeId={rootNode} previousMessages={[]} />
    </ResponsiveWrapper>
  )
}

export default App