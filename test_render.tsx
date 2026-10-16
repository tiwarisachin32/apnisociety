import React from 'react';
import ReactDOMServer from 'react-dom/server';
import App from './src/App';
import { MOCK_USERS } from './src/services/mockAuth';
import fs from 'fs';

// Mock global window & document & localStorage
const mockStorage: Record<string, string> = {};
const storage = {
  getItem: (k: string) => mockStorage[k] || null,
  setItem: (k: string, v: string) => { mockStorage[k] = v; },
  removeItem: (k: string) => { delete mockStorage[k]; },
  clear: () => { for (const k in mockStorage) delete mockStorage[k]; },
  length: 0,
  key: () => null,
};

(global as any).localStorage = storage;
(global as any).window = global;
(global as any).window.localStorage = storage;
(global as any).window.innerWidth = 1024;
(global as any).window.innerHeight = 768;
(global as any).window.addEventListener = () => {};
(global as any).window.removeEventListener = () => {};
(global as any).window.location = { reload: () => {} };

for (const user of MOCK_USERS) {
  mockStorage['apnisociety_user_session'] = JSON.stringify(user);
  mockStorage['apnisociety_current_user_id'] = user.id;

  const html = ReactDOMServer.renderToString(React.createElement(App));
  console.log(`=== USER: ${user.name} (${user.roleTitle}) ===`);
  console.log(`HTML length: ${html.length}`);
  fs.writeFileSync(`rendered_${user.id}.html`, `<div id="root">${html}</div>`);
}
