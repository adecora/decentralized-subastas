import "@/styles/globals.css"
// import "@/styles/app.css"
import "bootstrap/dist/css/bootstrap.min.css"

import Layout from "@/components/Layout"
import { BlockchainProvider } from "@/context/BlockchainContext"

export default function App({ Component, pageProps }) {
  return (
    <BlockchainProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </BlockchainProvider>
  )
}
