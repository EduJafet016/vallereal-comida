import { ImageResponse } from 'next/og';

export const runtime = 'edge';

const EMOJI_MAP: Record<string, string> = {
  plumbing: '🚰', zap: '⚡', medical: '🩺', hammer: '🪵',
  lock: '🔐', car: '🔧', clean: '🧹', paint: '🎨',
  tech: '💻', scissors: '✂️', delivery: '🚚', security: '🛡️',
  wrench: '🛠️', bug: '🐜', shirt: '🧵', book: '📚',
  shopping: '🛍️', dog: '🐕', home: '🏠',
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    let rawName = searchParams.get('name') || 'Valle Real';
    if (rawName && rawName.includes('%20')) {
      rawName = decodeURIComponent(rawName);
    }
    const name = rawName.slice(0, 50);

    const logo = searchParams.get('logo');
    const iconKey = searchParams.get('icon');
    const emoji = iconKey && EMOJI_MAP[iconKey] ? EMOJI_MAP[iconKey] : '🛠️';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#065f46',
            position: 'relative',
          }}
        >
          {logo ? (
            /* eslint-disable-next-line @next/next/no-img-element */
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
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                fontSize: 150,
                backgroundColor: '#047857',
              }}
            >
              {emoji}
            </div>
          )}

          {/* Degradado inferior */}
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '65%',
              background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent)',
            }}
          />

          {/* Nombre */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              right: 250,
              display: 'flex',
              color: 'white',
              fontSize: 52,
              fontWeight: '900',
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

          {/* Marca de agua */}
          <div
            style={{
              position: 'absolute',
              bottom: 40,
              right: 40,
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
              padding: '10px 22px',
              borderRadius: 30,
              boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
            }}
          >
            <span style={{ fontSize: 26, fontWeight: '900', color: '#047857', fontFamily: 'sans-serif' }}>
              Valle Real
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch {
    return new Response('Error generando tarjeta', { status: 500 });
  }
}