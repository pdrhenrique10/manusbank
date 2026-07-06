import { useIdioma } from '../context/IdiomaContext';

export default function SeletorIdioma() {
  const { idioma, mudarIdioma } = useIdioma();

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      zIndex: 10000,
      background: 'rgba(0,0,0,0.7)',
      padding: '6px 10px',
      borderRadius: '8px',
    }}>
      <select
        value={idioma}
        onChange={(e) => mudarIdioma(e.target.value)}
        style={{
          background: 'transparent',
          color: 'white',
          border: '1px solid rgba(255,255,255,0.3)',
          borderRadius: '4px',
          padding: '4px',
        }}
      >
        <option value="pt-BR">Português</option>
        <option value="en">Inglês</option>
        <option value="es">Espanhol</option>
      </select>
    </div>
  );
}