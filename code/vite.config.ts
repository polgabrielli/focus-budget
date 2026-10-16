/// <reference types="vitest" />
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const certsDir = path.resolve(__dirname, '.certs');
const certPath = path.join(certsDir, 'dev-cert.pem');
const keyPath = path.join(certsDir, 'dev-key.pem');
const rootCaPath = path.join(certsDir, 'rootCA.crt');

const hasHttpsCerts =
  process.env.VITE_NO_HTTPS !== '1' &&
  fs.existsSync(certPath) &&
  fs.existsSync(keyPath);

const httpsOptions = hasHttpsCerts
  ? {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    }
  : undefined;

/**
 * Levanta un micro-servidor HTTP en el puerto 5174 para que desde Safari en iPhone
 * puedas descargar e instalar el certificado Root CA con 1 toque (sin alertas previas).
 */
function iphoneCaInstallerPlugin(): Plugin {
  let caServer: http.Server | null = null;

  const startCaServer = () => {
    if (caServer || !fs.existsSync(rootCaPath)) return;

    caServer = http.createServer((req, res) => {
      if (req.url === '/rootCA.crt' || req.url === '/rootCA.pem') {
        const crt = fs.readFileSync(rootCaPath);
        res.writeHead(200, {
          'Content-Type': 'application/x-x509-ca-cert',
          'Content-Disposition': 'attachment; filename="focus-budget-rootCA.crt"',
          'Content-Length': crt.length,
        });
        res.end(crt);
        return;
      }

      const hostHeader = (req.headers.host || 'localhost').split(':')[0];
      const httpsAppUrl = `https://${hostHeader}:5173`;

      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Focus Budget · Instalar Certificado HTTPS en iPhone</title>
  <style>
    body { margin: 0; font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0A0D12; color: #F8FAFC; padding: 24px 18px; line-height: 1.5; }
    .card { max-width: 460px; margin: 0 auto; background: #121721; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 22px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { color: #94A3B8; font-size: 14px; margin: 0 0 18px; }
    .btn { display: block; text-align: center; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 16px; border-radius: 12px; margin-bottom: 12px; }
    .btn-primary { background: #10B981; color: #052E16; }
    .btn-secondary { background: #1E2738; color: #F8FAFC; border: 1px solid rgba(255,255,255,0.12); }
    ol { padding-left: 20px; color: #CBD5E1; font-size: 14px; margin: 16px 0 22px; }
    li { margin-bottom: 10px; }
    strong { color: #F8FAFC; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Activar HTTPS en tu iPhone</h1>
    <p>Seguí estos pasos por única vez desde <strong>Safari</strong> para instalar Focus Budget como PWA sin advertencias.</p>
    <a class="btn btn-primary" href="/rootCA.crt">1. Descargar Certificado Root CA</a>
    <ol>
      <li>Tocá el botón verde de arriba y elegí <strong>"Permitir"</strong> cuando iOS te avise que se descargó un perfil.</li>
      <li>Abrí la app <strong>Configuración</strong> del iPhone &rarr; arriba del todo tocá <strong>"Perfil descargado"</strong> &rarr; <strong>Instalar</strong>.</li>
      <li>Andá a <strong>Configuración &rarr; General &rarr; Información &rarr; Configuración de certificados</strong> (abajo del todo) y activá el interruptor de <strong>mkcert</strong>.</li>
    </ol>
    <a class="btn btn-secondary" href="${httpsAppUrl}">2. Abrir Focus Budget (HTTPS)</a>
  </div>
</body>
</html>`);
    });

    caServer.on('error', () => {
      // Si el puerto 5174 ya está en uso, ignorar silenciosamente
    });

    caServer.listen(5174, '0.0.0.0', () => {
      console.log('  ➜  iPhone CA Installer: http://localhost:5174 (abrilo en Safari desde tu iPhone por única vez)');
    });
  };

  return {
    name: 'focus-budget-iphone-ca-installer',
    configureServer(server) {
      startCaServer();
      server.httpServer?.once('close', () => caServer?.close());
    },
    configurePreviewServer(server) {
      startCaServer();
      server.httpServer?.once('close', () => caServer?.close());
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), iphoneCaInstallerPlugin()],
  server: {
    host: true, // Listen on all local IPs (essential for testing from iPhone 11 via local Wi-Fi)
    port: 5173,
    https: httpsOptions,
  },
  preview: {
    host: true,
    port: 5173,
    https: httpsOptions,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          xlsx: ['xlsx'],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
  },
});

