import Document, { Html, Head, Main, NextScript } from "next/document";

export default class MainhallDocument extends Document {
  render() {
    const home = this.props.__NEXT_DATA__.page === "/";
    return (
      <Html lang="ru">
        <Head />
        <body className={home ? "cinematic-home" : undefined}>
          <Main />
          <NextScript />
          {home && <>
            <script defer src="/atelier/assets/leaflet.js" />
            <script defer src="/atelier/assets/markercluster.js" />
            <script type="module" src="/atelier/app.mjs?v=20261120-review-hold" />
            <script type="module" src="/atelier/cinematic-motion.mjs" />
          </>}
        </body>
      </Html>
    );
  }
}
