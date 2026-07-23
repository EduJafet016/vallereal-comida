'use client';

import { use, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tenant, Product, Category } from '@/types';
import {
  Store,
  Lock,
  ShieldAlert,
  Check,
  X,
  RefreshCw,
  KeyRound,
  ShieldCheck,
  Plus,
  Utensils,
  Share2,
  Copy,
  ExternalLink,
  Settings,
  Phone,
  Clock,
  FileText,
  Trash2,
  AlertTriangle,
  Pencil,
} from 'lucide-react';

interface PageProps {
  params: Promise<{ token: string }>;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME_MS = 15 * 60 * 1000;

export default function TenantDashboardPage({ params }: PageProps) {
  const { token } = use(params);

  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loadingTenant, setLoadingTenant] = useState(true);
  const [tenantError, setTenantError] = useState(false);

  // Autenticación & PIN
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);

  // Datos
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Cambio de PIN
  const [newPin, setNewPin] = useState('');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [pinSuccessMsg, setPinSuccessMsg] = useState('');

  // Edición del Local
  const [isEditingTenant, setIsEditingTenant] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editWhatsapp, setEditWhatsapp] = useState('');
  const [editOpeningTime, setEditOpeningTime] = useState('');
  const [editClosingTime, setEditClosingTime] = useState('');
  const [savingTenant, setSavingTenant] = useState(false);
  const [tenantSuccessMsg, setTenantSuccessMsg] = useState('');

  // Eliminación del Local
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletePinConfirm, setDeletePinConfirm] = useState('');
  const [deletingTenant, setDeletingTenant] = useState(false);

  // Copia de enlaces
  const [copiedDashboard, setCopiedDashboard] = useState(false);
  const [copiedMenu, setCopiedMenu] = useState(false);

  // Modal Nuevo Producto
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newProdName, setNewProdName] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdDesc, setNewProdDesc] = useState('');
  const [newProdCategory, setNewProdCategory] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [creatingProduct, setCreatingProduct] = useState(false);

  // Modal Editar Producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editProdName, setEditProdName] = useState('');
  const [editProdPrice, setEditProdPrice] = useState('');
  const [editProdDesc, setEditProdDesc] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);

  // URLs
  const dashboardUrl = typeof window !== 'undefined' ? window.location.href : '';
  const menuUrl =
    typeof window !== 'undefined' && tenant
      ? `${window.location.origin}/${tenant.slug}`
      : '';

  const copyDashboardLink = () => {
    if (!dashboardUrl) return;
    navigator.clipboard.writeText(dashboardUrl);
    setCopiedDashboard(true);
    setTimeout(() => setCopiedDashboard(false), 3000);
  };

  const copyMenuLink = () => {
    if (!menuUrl) return;
    navigator.clipboard.writeText(menuUrl);
    setCopiedMenu(true);
    setTimeout(() => setCopiedMenu(false), 3000);
  };

  // 1. Cargar Tenant por Token
  useEffect(() => {
    async function fetchTenantByToken() {
      try {
        setLoadingTenant(true);
        const { data, error } = await supabase
          .from('tenants')
          .select('*')
          .eq('admin_token', token)
          .single();

        if (error || !data) {
          setTenantError(true);
          return;
        }

        setTenant(data);
        setEditName(data.name || '');
        setEditDescription(data.description || '');
        setEditWhatsapp(data.whatsapp_number || '');
        setEditOpeningTime(data.opening_time || '09:00');
        setEditClosingTime(data.closing_time || '21:00');

        const storedLock = localStorage.getItem(`lockout_${data.id}`);
        const storedAttempts = localStorage.getItem(`attempts_${data.id}`);
        const savedAuth = localStorage.getItem(`auth_token_${token}`);

        if (storedLock && parseInt(storedLock, 10) > Date.now()) {
          setLockoutUntil(parseInt(storedLock, 10));
        }
        if (storedAttempts) {
          setFailedAttempts(parseInt(storedAttempts, 10));
        }
        if (savedAuth === 'true') {
          setIsAuthenticated(true);
        }
      } catch {
        setTenantError(true);
      } finally {
        setLoadingTenant(false);
      }
    }

    if (token) fetchTenantByToken();
  }, [token]);

  // 2. Bypass automático para SuperAdmin y para accesos desde Master Admin (?pin=XXXX)
  useEffect(() => {
    if (!tenant) return;

    const checkAutoUnlock = async () => {
      if (typeof window !== 'undefined') {
        const urlParams = new URLSearchParams(window.location.search);
        const pinFromUrl = urlParams.get('pin');

        if (pinFromUrl && pinFromUrl === (tenant as any)?.admin_pin) {
          setIsAuthenticated(true);
          localStorage.setItem(`auth_token_${token}`, 'true');
          return;
        }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user?.app_metadata?.role === 'superadmin') {
        setIsAuthenticated(true);
        localStorage.setItem(`auth_token_${token}`, 'true');
      }
    };

    checkAutoUnlock();
  }, [tenant, token]);

  // Verificar PIN manual
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    if (lockoutUntil && Date.now() < lockoutUntil) return;

    const validPin = (tenant as any)?.admin_pin || '1234';

    if (pinInput.trim() === validPin) {
      setIsAuthenticated(true);
      setFailedAttempts(0);
      setLockoutUntil(null);
      localStorage.removeItem(`attempts_${tenant.id}`);
      localStorage.removeItem(`lockout_${tenant.id}`);
      localStorage.setItem(`auth_token_${token}`, 'true');
    } else {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      localStorage.setItem(`attempts_${tenant.id}`, nextAttempts.toString());

      if (nextAttempts >= MAX_ATTEMPTS) {
        const lockoutTime = Date.now() + LOCKOUT_TIME_MS;
        setLockoutUntil(lockoutTime);
        localStorage.setItem(`lockout_${tenant.id}`, lockoutTime.toString());
      }
    }
  };

  // Cargar Categorías y Productos
  const loadData = useCallback(async () => {
    if (!tenant || !isAuthenticated) return;

    setLoadingProducts(true);

    const { data: catData } = await supabase
      .from('categories')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('sort_order');

    setCategories(catData || []);

    const { data: prodData } = await supabase
      .from('products')
      .select('*, categories(name)')
      .eq('tenant_id', tenant.id)
      .order('category_id');

    setProducts(prodData || []);
    setLoadingProducts(false);
  }, [tenant, isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Guardar Edición del Tenant
  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    const cleanPhone = editWhatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      alert('Ingresa un número de WhatsApp válido de al menos 10 dígitos.');
      return;
    }

    setSavingTenant(true);

    const { error } = await supabase
      .from('tenants')
      .update({
        name: editName.trim(),
        description: editDescription.trim() || null,
        whatsapp_number: cleanPhone,
        opening_time: editOpeningTime,
        closing_time: editClosingTime,
      })
      .eq('id', tenant.id);

    if (error) {
      alert(`Error al actualizar la información: ${error.message}`);
    } else {
      setTenant({
        ...tenant,
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        whatsapp_number: cleanPhone,
        opening_time: editOpeningTime,
        closing_time: editClosingTime,
      });
      setIsEditingTenant(false);
      setTenantSuccessMsg('Información del restaurante actualizada correctamente.');
      setTimeout(() => setTenantSuccessMsg(''), 4000);
    }

    setSavingTenant(false);
  };

  // Eliminar Restaurante
  const handleDeleteTenant = async () => {
    if (!tenant) return;

    if (deletePinConfirm !== (tenant as any).admin_pin) {
  alert('El PIN de confirmación es incorrecto.');
  return;
}

    setDeletingTenant(true);

    try {
      const { error } = await supabase
        .from('tenants')
        .delete()
        .eq('id', tenant.id);

      if (error) throw error;

      alert('Tu restaurante ha sido eliminado correctamente.');
      localStorage.removeItem(`auth_token_${token}`);
      window.location.href = '/';
    } catch (err: any) {
      alert(`Error al eliminar el restaurante: ${err.message}`);
    } finally {
      setDeletingTenant(false);
    }
  };

  // Crear Nuevo Producto
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    setCreatingProduct(true);

    try {
      let categoryId = newProdCategory;

      if (!categoryId && newCategoryName.trim()) {
        const { data: newCat, error: catErr } = await supabase
          .from('categories')
          .insert([
            {
              tenant_id: tenant.id,
              name: newCategoryName.trim(),
              sort_order: categories.length + 1,
            },
          ])
          .select()
          .single();

        if (catErr || !newCat) {
          alert('Error al crear la categoría.');
          setCreatingProduct(false);
          return;
        }
        categoryId = newCat.id;
      }

      if (!categoryId) {
        alert('Por favor selecciona o escribe una categoría.');
        setCreatingProduct(false);
        return;
      }

      const { error: prodErr } = await supabase.from('products').insert([
        {
          tenant_id: tenant.id,
          category_id: categoryId,
          name: newProdName.trim(),
          description: newProdDesc.trim() || null,
          price: parseFloat(newProdPrice),
          is_available: true,
        },
      ]);

      if (prodErr) {
        alert(`Error al guardar platillo: ${prodErr.message}`);
      } else {
        setNewProdName('');
        setNewProdPrice('');
        setNewProdDesc('');
        setNewProdCategory('');
        setNewCategoryName('');
        setIsAddModalOpen(false);
        await loadData();
      }
    } catch {
      alert('Error inesperado al crear platillo.');
    } finally {
      setCreatingProduct(false);
    }
  };

  // Abrir modal de edición con los datos actuales
  const openEditProductModal = (product: Product) => {
    setEditingProduct(product);
    setEditProdName(product.name);
    setEditProdPrice(product.price.toString());
    setEditProdDesc(product.description || '');
  };

  // Guardar la edición completa del producto
  const handleSaveProductEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setSavingProduct(true);

    const { error } = await supabase
      .from('products')
      .update({
        name: editProdName.trim(),
        price: parseFloat(editProdPrice),
        description: editProdDesc.trim() || null,
      })
      .eq('id', editingProduct.id);

    if (error) {
      alert(`Error al actualizar el platillo: ${error.message}`);
    } else {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name: editProdName.trim(),
                price: parseFloat(editProdPrice),
                description: editProdDesc.trim() || undefined,
              }
            : p
        )
      );
      setEditingProduct(null);
    }

    setSavingProduct(false);
  };

  // Eliminar un platillo individual
  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`¿Estás seguro de eliminar "${product.name}"?`)) return;

    setUpdatingId(product.id);
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', product.id);

    if (error) {
      alert(`Error al eliminar el platillo: ${error.message}`);
    } else {
      setProducts((prev) => prev.filter((p) => p.id !== product.id));
    }
    setUpdatingId(null);
  };

  // Toggle Disponibilidad
  const toggleAvailability = async (product: Product) => {
    setUpdatingId(product.id);
    const newStatus = !product.is_available;

    const { error } = await supabase
      .from('products')
      .update({ is_available: newStatus })
      .eq('id', product.id);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, is_available: newStatus } : p))
      );
    }
    setUpdatingId(null);
  };

  // Cambiar Precio
  const updatePrice = async (productId: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;

    setUpdatingId(productId);
    const { error } = await supabase
      .from('products')
      .update({ price: newPrice })
      .eq('id', productId);

    if (!error) {
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, price: newPrice } : p))
      );
    }
    setUpdatingId(null);
  };

  // Cambiar PIN
  const handleUpdatePin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant || newPin.length !== 4 || isNaN(Number(newPin))) return;

    const { error } = await supabase
      .from('tenants')
      .update({ admin_pin: newPin })
      .eq('id', tenant.id);

    if (!error) {
      setTenant({ ...tenant, admin_pin: newPin } as any);
      setPinSuccessMsg('PIN actualizado correctamente');
      setNewPin('');
      setIsChangingPin(false);
      setTimeout(() => setPinSuccessMsg(''), 4000);
    }
  };

  if (loadingTenant) {
    return <div className="p-8 text-center text-sm text-gray-500">Cargando panel...</div>;
  }

  if (tenantError || !tenant) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 text-center">
        <h2 className="text-xl font-bold text-gray-800 mb-2">Acceso Denegado 🔒</h2>
        <p className="text-sm text-gray-500 max-w-xs">
          El token de administración es inválido o no existe.
        </p>
      </div>
    );
  }

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;
  const remainingMinutes = isLockedOut
    ? Math.ceil((lockoutUntil - Date.now()) / 60000)
    : 0;

  return (
    <main className="p-4 max-w-lg mx-auto min-h-screen bg-gray-50">
      <header className="border-b pb-4 mb-6 bg-white p-4 rounded-2xl shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-600" /> {tenant.name}
        </h1>
        <p className="text-xs text-gray-500">Panel de Administración Directa</p>
      </header>

      {!isAuthenticated ? (
        <div className="bg-white p-6 rounded-2xl shadow-sm border text-center space-y-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
            {isLockedOut ? (
              <ShieldAlert className="w-6 h-6 text-red-600" />
            ) : (
              <Lock className="w-6 h-6" />
            )}
          </div>

          <div>
            <h2 className="font-bold text-gray-900">Ingreso al Panel</h2>
            <p className="text-xs text-gray-500 mt-1">Ingresa tu PIN de 4 dígitos</p>
          </div>

          {isLockedOut ? (
            <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold">
              Demasiados intentos fallidos. Bloqueado por {remainingMinutes} min.
            </div>
          ) : (
            <form onSubmit={handleVerifyPin} className="space-y-3 max-w-xs mx-auto">
              <input
                type="password"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={4}
                placeholder="0 0 0 0"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono text-gray-900 font-bold tracking-widest p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />

              {failedAttempts > 0 && (
                <p className="text-xs text-red-500 font-semibold">
                  PIN incorrecto. Intentos restantes: {MAX_ATTEMPTS - failedAttempts}
                </p>
              )}

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition-all shadow-md active:scale-[0.98]"
              >
                Ingresar
              </button>
            </form>
          )}
        </div>
      ) : (
        /* VISTA AUTENTICADA */
        <div className="space-y-6">
          {pinSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> {pinSuccessMsg}
            </div>
          )}

          {tenantSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold p-3 rounded-xl flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" /> {tenantSuccessMsg}
            </div>
          )}

          {/* TARJETA CONFIGURACIÓN DEL LOCAL */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-emerald-600" /> Datos del Local
              </span>
              <button
                onClick={() => setIsEditingTenant(!isEditingTenant)}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                {isEditingTenant ? 'Cancelar' : 'Editar Información'}
              </button>
            </div>

            {!isEditingTenant ? (
              <div className="text-xs space-y-1.5 text-gray-700">
                <p><strong className="text-gray-900">Nombre:</strong> {tenant.name}</p>
                <p><strong className="text-gray-900">Descripción:</strong> {tenant.description || 'Sin descripción'}</p>
                <p><strong className="text-gray-900">WhatsApp:</strong> {tenant.whatsapp_number}</p>
                <p><strong className="text-gray-900">Horario:</strong> {tenant.opening_time.slice(0, 5)} - {tenant.closing_time.slice(0, 5)}</p>
              </div>
            ) : (
              <form onSubmit={handleSaveTenant} className="space-y-3 pt-1">
                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Nombre</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">Descripción Corta</label>
                  <input
                    type="text"
                    placeholder="Ej. Tacos, empanadas y antojitos"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1">WhatsApp de Pedidos</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={editWhatsapp}
                    onChange={(e) => setEditWhatsapp(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Apertura</label>
                    <input
                      type="time"
                      value={editOpeningTime}
                      onChange={(e) => setEditOpeningTime(e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">Cierre</label>
                    <input
                      type="time"
                      value={editClosingTime}
                      onChange={(e) => setEditClosingTime(e.target.value)}
                      className="w-full p-2 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingTenant}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50"
                >
                  {savingTenant ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </form>
            )}
          </div>

          {/* TARJETA DE ENLACES RÁPIDOS */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b pb-2">
              <Share2 className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Enlaces de tu Negocio
              </h3>
            </div>

            <div className="space-y-2">
              {/* Enlace del Dashboard Privado */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border text-xs">
                <div className="truncate pr-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">
                    Panel de Administración (Privado)
                  </span>
                  <span className="font-mono text-gray-700 truncate block">
                    {dashboardUrl}
                  </span>
                </div>
                <button
                  onClick={copyDashboardLink}
                  className="px-3 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center gap-1 shrink-0 transition-all active:scale-95"
                >
                  {copiedDashboard ? (
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                  )}
                  {copiedDashboard ? 'Copiado' : 'Copiar'}
                </button>
              </div>

              {/* Enlace del Menú Público */}
              <div className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 rounded-xl border text-xs">
                <div className="truncate pr-2">
                  <span className="block text-[10px] font-bold text-gray-400 uppercase">
                    Menú para Clientes (Público)
                  </span>
                  <span className="font-mono text-gray-700 truncate block">
                    /{tenant.slug}
                  </span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={copyMenuLink}
                    className="px-2.5 py-1.5 bg-white border rounded-lg hover:bg-gray-100 text-gray-700 font-semibold text-xs flex items-center gap-1 transition-all active:scale-95"
                  >
                    {copiedMenu ? (
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-gray-500" />
                    )}
                    {copiedMenu ? 'Copiado' : 'Copiar'}
                  </button>
                  <a
                    href={menuUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-all"
                    title="Ver menú público"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Seguridad / PIN */}
          <div className="bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <KeyRound className="w-4 h-4 text-emerald-600" /> Seguridad
              </span>
              <button
                onClick={() => setIsChangingPin(!isChangingPin)}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                {isChangingPin ? 'Cancelar' : 'Cambiar PIN'}
              </button>
            </div>

            {isChangingPin && (
              <form onSubmit={handleUpdatePin} className="mt-3 pt-3 border-t flex gap-2">
                <input
                  type="password"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={4}
                  placeholder="Nuevo PIN"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 p-2 border rounded-xl text-xs font-mono text-gray-900 text-center focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 text-white font-bold px-3 py-2 rounded-xl text-xs hover:bg-emerald-700"
                >
                  Guardar
                </button>
              </form>
            )}
          </div>

          {/* Sección Platillos */}
          <section className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                Platillos
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="text-xs bg-emerald-600 text-white font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 shadow-sm hover:bg-emerald-700 active:scale-95 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar
                </button>
                <button
                  onClick={loadData}
                  className="text-xs text-emerald-600 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Actualizar
                </button>
              </div>
            </div>

            {loadingProducts ? (
              <div className="text-center py-6 text-xs text-gray-400">Cargando...</div>
            ) : products.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed text-gray-400 space-y-2">
                <Utensils className="w-8 h-8 mx-auto text-gray-300" />
                <p className="text-xs font-medium text-gray-500">
                  Aún no has agregado platillos.
                </p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="inline-flex items-center gap-1 text-xs text-emerald-600 font-bold hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" /> Agregar mi primer platillo
                </button>
              </div>
            ) : (
              products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-white border rounded-2xl shadow-sm flex justify-between items-center gap-2"
                >
                  <div className="pr-2 flex-1">
                    <h3 className="font-semibold text-gray-900 text-sm">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-xs text-gray-400 line-clamp-1">
                        {product.description}
                      </p>
                    )}
                    <span
                      className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        product.is_available
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {product.is_available ? 'Disponible' : 'Agotado'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* BOTÓN EDITAR */}
                    <button
                      onClick={() => openEditProductModal(product)}
                      className="p-2 bg-gray-50 hover:bg-gray-100 border text-gray-600 rounded-xl transition-all active:scale-95"
                      title="Editar platillo"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>

                    {/* BOTÓN ELIMINAR */}
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl transition-all active:scale-95"
                      title="Eliminar platillo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>

                    {/* INPUT PRECIO */}
                    <div className="flex items-center gap-1 bg-gray-50 border px-2 py-1 rounded-xl">
                      <span className="text-xs font-bold text-gray-400">$</span>
                      <input
                        type="number"
                        step="0.5"
                        defaultValue={product.price}
                        onBlur={(e) => updatePrice(product.id, parseFloat(e.target.value))}
                        className="w-12 text-sm font-bold text-gray-900 bg-transparent text-center focus:outline-none"
                      />
                    </div>

                    {/* TOGGLE DISPONIBILIDAD */}
                    <button
                      disabled={updatingId === product.id}
                      onClick={() => toggleAvailability(product)}
                      className={`p-2 rounded-xl text-xs font-bold ${
                        product.is_available
                          ? 'bg-red-50 text-red-600'
                          : 'bg-emerald-50 text-emerald-600'
                      }`}
                    >
                      {updatingId === product.id ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : product.is_available ? (
                        <X className="w-4 h-4" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </section>

          {/* ZONA DE PELIGRO - ELIMINAR RESTAURANTE */}
          <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 space-y-3">
            <div className="flex items-center gap-2 border-b border-red-100 pb-2 text-red-700">
              <AlertTriangle className="w-4 h-4" />
              <h3 className="text-xs font-bold uppercase tracking-wider">Zona de Peligro</h3>
            </div>
            <p className="text-xs text-gray-600">
              Si eliminas este local, perderás de forma permanente tu menú, platillos y configuraciones.
            </p>
            <button
              onClick={() => setIsDeleteModalOpen(true)}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Trash2 className="w-4 h-4" /> Eliminar Restaurante
            </button>
          </div>

          {/* MODAL DE CONFIRMACIÓN DE BORRADO DE TENANT */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4 border">
                <div className="text-center space-y-2">
                  <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
                    <Trash2 className="w-6 h-6" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-base">¿Eliminar {tenant.name}?</h3>
                  <p className="text-xs text-gray-500">
                    Esta acción es <strong className="text-red-600">irreversible</strong>.
                  </p>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 block mb-1 text-center">
                    Escribe tu PIN para confirmar:
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={4}
                    value={deletePinConfirm}
                    onChange={(e) => setDeletePinConfirm(e.target.value.replace(/\D/g, ''))}
                    placeholder="••••"
                    className="w-full p-3 border rounded-xl text-center text-lg font-mono font-bold tracking-widest text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsDeleteModalOpen(false);
                      setDeletePinConfirm('');
                    }}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleDeleteTenant}
                    disabled={deletingTenant || deletePinConfirm.length !== 4}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                  >
                    {deletingTenant ? 'Eliminando...' : 'Sí, eliminar'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* MODAL PARA EDITAR PLATILLO */}
          {editingProduct && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-gray-900 text-base">Editar Platillo</h3>
                  <button
                    onClick={() => setEditingProduct(null)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveProductEdit} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      value={editProdName}
                      onChange={(e) => setEditProdName(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Precio ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      value={editProdPrice}
                      onChange={(e) => setEditProdPrice(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Descripción
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Escribe los detalles o ingredientes..."
                      value={editProdDesc}
                      onChange={(e) => setEditProdDesc(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingProduct(null)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 rounded-xl text-xs transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={savingProduct}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all shadow-md disabled:opacity-50"
                    >
                      {savingProduct ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* MODAL PARA AGREGAR PLATILLO */}
          {isAddModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <h3 className="font-bold text-gray-900 text-base">Nuevo Platillo</h3>
                  <button
                    onClick={() => setIsAddModalOpen(false)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleCreateProduct} className="space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. Tacos al Pastor"
                      value={newProdName}
                      onChange={(e) => setNewProdName(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Precio ($)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      required
                      placeholder="Ej. 45"
                      value={newProdPrice}
                      onChange={(e) => setNewProdPrice(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Categoría
                    </label>
                    {categories.length > 0 ? (
                      <select
                        value={newProdCategory}
                        onChange={(e) => setNewProdCategory(e.target.value)}
                        className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none mb-2"
                      >
                        <option value="">-- Seleccionar o crear nueva --</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    ) : null}

                    {(!newProdCategory || categories.length === 0) && (
                      <input
                        type="text"
                        placeholder="Nueva categoría (Ej. Entradas, Bebidas)"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Descripción (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Ej. Con queso, salsa y verdura..."
                      value={newProdDesc}
                      onChange={(e) => setNewProdDesc(e.target.value)}
                      className="w-full p-2.5 border rounded-xl text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={creatingProduct}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md active:scale-[0.98] disabled:opacity-50 mt-2"
                  >
                    {creatingProduct ? 'Guardando...' : 'Guardar Platillo'}
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </main>
  );
}