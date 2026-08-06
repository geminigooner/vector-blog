import { jsx } from 'react/jsx-runtime';
import Markdown from 'react-markdown';
import { renderToString } from 'react-dom/server';

const md = '![image](inline:0)';

console.log(renderToString(jsx(Markdown, {
  children: md,
  urlTransform: (url) => url,
  components: {
    img: (props) => jsx('img', { ...props, "data-custom": "true" })
  }
})));
