import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import { ByteBrew } from 'bytebrew-web-sdk';
import App from './App.tsx';
import './index.css';

ByteBrew.initializeByteBrew('wBR6jvgRg', '4unOkc8hoXUT7wtFjTqUSMIQ4ooMZW2Qtwmuia5VkCRZkQtM00UJLZHX8ITYRMdo', '1.0.0');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
