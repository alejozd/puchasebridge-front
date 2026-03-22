# Cómo agregar un endpoint nuevo en PurchaseBridge Front

Este proyecto sigue una arquitectura por capas para separar responsabilidades y evitar que la UI dependa directamente de Axios.

## Flujo recomendado

1. **UI (Page o Component)**: captura el evento del botón y llama una función de un hook/store.
2. **Hook/Store**: maneja estado de carga/errores y orquesta la operación.
3. **Service**: define el consumo HTTP concreto (ruta, método, payload y tipado).
4. **axiosClient**: añade configuración transversal (baseURL, token, interceptores).

## Patrón A: Página + Hook + Service (ejemplo de `procesar XML`)

### 1) Service
En `src/services/xmlService.ts` se crea la función HTTP:

```ts
export const aprobarXML = async (id: number): Promise<AprobarResponse> => {
  const response = await axiosClient.post<AprobarResponse>(`/xml/aprobar/${id}`);
  return response.data;
};
```

### 2) Hook
En `src/hooks/useXmlDetail.ts`, agrega un método que llame al service y controle loading/error:

```ts
const aprobar = async (id: number): Promise<AprobarResponse | null> => {
  setProcessing(true);
  try {
    return await aprobarXML(id);
  } catch (err) {
    console.error('Error al aprobar:', err);
    return null;
  } finally {
    setProcessing(false);
  }
};
```

### 3) UI (Page)
En `src/pages/procesamiento/ProcesamientoPage.tsx`, el botón solo dispara el caso de uso:

```ts
const handleAprobar = async () => {
  if (!detail) return;
  const result = await aprobar(detail.id);
  if (result?.success) {
    // feedback UI + refrescar estado local
  }
};
```

## Patrón B: Página + Store (Zustand) + Service (ejemplo de `validar XML`)

Cuando varias vistas comparten el estado, se usa store (`useXMLStore`):

1. Crear función service en `xmlService.ts`.
2. Exponer acción async en `src/store/xmlStore.ts`.
3. Consumir esa acción desde la página (`XMLValidationPage.tsx`).

## ¿Por qué tantas capas?

- **Mantenibilidad**: si cambia el endpoint solo ajustas service/store/hook.
- **Reutilización**: varios componentes pueden usar la misma lógica.
- **Testeabilidad**: puedes testear hooks/stores sin renderizar toda la página.
- **Consistencia**: token/baseURL/interceptores centralizados en `axiosClient`.

## Checklist rápido para endpoint nuevo

- [ ] Definir tipos en `src/types/*.ts`.
- [ ] Crear función en `src/services/xmlService.ts` (o el service del módulo).
- [ ] Exponer acción en hook (`src/hooks`) o store (`src/store`) según corresponda.
- [ ] Invocar desde page/component (`src/pages` o `src/components`).
- [ ] Manejar `loading`, `error` y feedback (Toast/Dialog).
- [ ] Actualizar lista/estado local tras éxito (`refresh`, `setFiles`, o acción store).

## Regla práctica

Si la acción solo vive en una pantalla y no requiere estado global, usa **hook**.
Si varias pantallas comparten estado/operaciones, usa **Zustand store**.
