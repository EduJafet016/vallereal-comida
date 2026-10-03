import { ImageResponse } from 'next/og';
import { 
  Wrench, Zap, Stethoscope, Droplet, Hammer, 
  Scissors, ShieldAlert, Sparkles, Paintbrush, 
  Car, Key, Laptop, Truck, Bug, Shirt, BookOpen, ShoppingBag, Dog, Home
} from 'lucide-react';

export const runtime = 'edge';

const ICON_MAP: Record<string, React.ElementType> = {
  plumbing: Droplet, zap: Zap, medical: Stethoscope, hammer: Hammer,
  lock: Key, car: Car, clean: Sparkles, paint: Paintbrush,
  tech: Laptop, scissors: Scissors, delivery: Truck,
  security: ShieldAlert, wrench: Wrench,
  bug: Bug, shirt: Shirt, book: BookOpen, shopping: ShoppingBag, dog: Dog, home: Home
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Obtenemos el nombre (y parcheamos con decodeURIComponent por si acaso algún cliente viejo lo manda doble)
    let rawName = searchParams.get('name') || 'Servicio en Valle Real';
    if (rawName.includes('%20')) {
      rawName = decodeURIComponent(rawName);
    }
    const name = rawName.slice(0, 50);

    const logo = searchParams.get('logo');
    const iconKey = searchParams.get('icon');
    
    const IconComponent = iconKey && ICON_MAP[iconKey] ? ICON_MAP[iconKey] : null;

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
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                backgroundColor: '#047857',
              }}
            >
              {IconComponent ? (
                // Dibujamos el SVG de Lucide en gigante
                <IconComponent width={250} height={250} color="rgba(255,255,255,0.9)" />
              ) : (
                <div style={{ fontSize: 200, color: 'white', fontWeight: '900' }}>
                  {name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
          )}

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

          <div
            style={{
              position: 'absolute',
              bottom: 40,
              left: 40,
              right: 250,
              display: 'flex',
              color: 'white',
              fontSize: 56,
              fontWeight: '900',
              fontFamily: 'sans-serif',
              letterSpacing: '-0.02em',
              lineHeight: 1.1,
            }}
          >
            {name}
          </div>

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