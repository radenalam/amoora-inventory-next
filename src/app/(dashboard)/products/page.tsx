'use client';

import { useState, useEffect } from 'react';
import { useStore, Product } from '@/store/useStore';
import { formatCurrency } from '@/lib/utils';
import { Plus, Edit2, Trash2, X, Loader2, Package, Search } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';
import { Skeleton, EmptyState, ConfirmDialog } from '@/components/UI';

export default function ProductsPage() {
  const { products, fetchProducts, addProduct, updateProduct, deleteProduct } = useStore();
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchProducts().finally(() => setLoadingData(false));
  }, []);

  const [formData, setFormData] = useState({ name: '', description: '', price: 0, unit: 'pcs' });

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({ name: product.name, description: product.description, price: product.price, unit: product.unit });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', price: 0, unit: 'pcs' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => { setIsModalOpen(false); setEditingProduct(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast('Produk berhasil diperbarui');
      } else {
        await addProduct(formData);
        showToast('Produk berhasil ditambahkan');
      }
      handleCloseModal();
    } catch { showToast('Gagal menyimpan produk', 'error'); }
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteProduct(deleteTarget.id);
      showToast('Produk berhasil dihapus');
      setDeleteTarget(null);
    } catch { showToast('Gagal menghapus produk', 'error'); }
    setDeleting(false);
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Produk</h2>
          <p className="mt-1 text-sm text-gray-500">Kelola daftar produk atau layanan untuk invoice.</p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button onClick={() => handleOpenModal()} className="inline-flex items-center justify-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 transition-colors">
            <Plus className="w-4 h-4 mr-2" />Tambah Produk
          </button>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative rounded-lg max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" className="block w-full pl-10 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" placeholder="Cari produk..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {loadingData ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <div className="flex-1" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Package}
            title={searchTerm ? 'Produk tidak ditemukan' : 'Belum ada produk'}
            description={searchTerm ? 'Coba kata kunci lain' : 'Tambahkan produk pertama Anda untuk digunakan di invoice.'}
            action={!searchTerm && (
              <button onClick={() => handleOpenModal()} className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                <Plus className="w-4 h-4 mr-2" />Tambah Produk
              </button>
            )}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Nama Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Deskripsi</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Harga</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Satuan</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate hidden sm:table-cell">{product.description || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatCurrency(product.price)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 hidden sm:table-cell">{product.unit}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleOpenModal(product)} className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => setDeleteTarget(product)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Hapus"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div className="fixed inset-0 bg-black/50" onClick={handleCloseModal} />
          <div className="flex items-center justify-center min-h-screen p-4">
            <div className="relative bg-white rounded-xl text-left overflow-hidden shadow-xl w-full max-w-lg z-10" onClick={(e) => e.stopPropagation()}>
              <div className="bg-white px-6 pt-6 pb-4 sm:p-6 sm:pb-4">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">{editingProduct ? 'Edit Produk' : 'Tambah Produk'}</h3>
                  <button onClick={handleCloseModal} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Produk</label>
                    <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" placeholder="Contoh: Kemeja Batik Premium" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                    <textarea rows={2} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" placeholder="Deskripsi singkat produk" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Harga Default</label>
                      <input type="number" required min="0" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                      <input type="text" required value={formData.unit} onChange={(e) => setFormData({ ...formData, unit: e.target.value })} className="block w-full border border-gray-300 rounded-lg py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm" placeholder="pcs, kg, dll" />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end gap-3">
                    <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">Batal</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors inline-flex items-center gap-2">
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}{editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        title="Hapus Produk"
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmLabel="Hapus"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
