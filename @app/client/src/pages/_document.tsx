import Document, {
  DocumentContext,
  Head,
  Html,
  Main,
  NextScript,
} from "next/document";
import React from "react";

// Fix for Ant Design server-side rendering: https://github.com/ant-design/ant-design/issues/30396
React["useLayoutEffect"] =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

  render() {
    return (
      <Html>
        <Head>
          <link rel="shortcut icon" type="image/x-icon" href="/favicon.png" />
          <link
            href="https://fonts.googleapis.com/css2?family=Poppins:wght@100;200;300;400;500;600;700;800&display=swap"
            rel="stylesheet"
          />
          <script
            id="kakao-map-sdk"
            type="text/javascript"
            src="//dapi.kakao.com/v2/maps/sdk.js?appkey=bc729dab1397cc4612b6b86217c1bf3a&libraries=services,clusterer,drawing&autoload=false"
            defer
          ></script>
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    );
  }
}

export default MyDocument;
