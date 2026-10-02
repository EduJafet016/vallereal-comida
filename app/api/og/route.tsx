import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name')?.slice(0, 50) || 'Local en Valle Real';
    const logo = searchParams.get('logo');

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#065f46', // Fondo esmeralda por defecto
            position: 'relative',
          }}
        >
          {/* Logo del negocio ocupando el fondo */}
          {logo ? (
            <img
              src={logo}
              alt="Logo"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            // Si no tiene logo, mostramos la inicial en gigante
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: 200,
                color: 'white',
                fontWeight: 'bold',
              }}
            >
              {name.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Degradado oscuro en la parte inferior para que la letra resalte */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '60%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            }}
          />

          {/* Nombre del local en grande en la parte inferior izquierda */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              display: 'flex',
              color: 'white',
              fontSize: 64,
              fontWeight: '900',
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
            }}
          >
            {name}
          </div>

          {/* Tu Marca de Agua (App Logo) en la esquina inferior derecha */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '12px 24px',
              borderRadius: 30,
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
            }}
          >
            {/* Si tienes un logo chiquito de tu app en public/, puedes usar un <img> aquí. 
                Por ahora pondremos el texto premium. */}
            <span style={{ fontSize: 32, fontWeight: '900', color: '#047857', fontFamily: 'sans-serif' }}>
              Valle Real
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630, // Medidas oficiales para tarjetas de WhatsApp/Facebook
      }
    );
  } catch (e) {
    return new Response('Failed to generate image', { status: 500 });
  }
}