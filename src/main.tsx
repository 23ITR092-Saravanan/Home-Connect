import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Unable to start Home Connect: the #root element is missing.');
}

createRoot(rootElement).render(<App />);
