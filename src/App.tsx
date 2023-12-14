import { AppRoutes, CommonLayoutWrapper } from "./app/services/routes"
import { BrowserRouter } from "react-router-dom"

function App() {
  return  (
    <BrowserRouter>
      <CommonLayoutWrapper>
        <AppRoutes/> 
      </CommonLayoutWrapper>
    </BrowserRouter>
  )
}

export default App
