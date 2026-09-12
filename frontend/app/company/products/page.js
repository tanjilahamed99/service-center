"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Plus, Search, RotateCcw, Pencil, Trash2, X } from "lucide-react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from "@/actions/company";
import Swal from "sweetalert2";

const EMPTY_FORM = { brand: "", productName: "", model: "", status: "Active" };

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-emerald-50 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      }`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-slate-400"}`}
      />
      {status}
    </span>
  );
}

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [deletingId, setDeletingId] = useState(null);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const { data } = await getProducts();
      setProducts(data?.data ?? []);
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't load products.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        !search ||
        p.brand.toLowerCase().includes(search.toLowerCase()) ||
        p.productName.toLowerCase().includes(search.toLowerCase()) ||
        p.model.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "All" || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [products, search, statusFilter]);

  function openAddModal() {
    setForm(EMPTY_FORM);
    setFormError("");
    setIsModalOpen(true);
  }

  function openEditModal(product) {
    setForm({
      id: product._id,
      brand: product.brand,
      productName: product.productName,
      model: product.model,
      status: product.status,
    });
    setFormError("");
    setIsModalOpen(true);
  }

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setIsSaving(true);
    setFormError("");
    try {
      if (form.id) {
        await updateProduct(form.id, form);
      } else {
        await createProduct(form);
      }
      setIsModalOpen(false);
      await fetchProducts();
    } catch (err) {
      setFormError(
        err.response?.data?.message ||
          "Something went wrong. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(id) {
    setDeletingId(id);
    try {
      Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      }).then(async (result) => {
        if (result.isConfirmed) {
          await deleteProduct(id);
          await fetchProducts();
          Swal.fire({
            title: "Deleted!",
            text: "Your file has been deleted.",
            icon: "success",
          });
        }
      });
    } catch (err) {
      setError(err.response?.data?.message || "Couldn't delete this product.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.15em] text-electric-500">
            Master Data
          </p>
          <h2 className="mt-1 text-xl font-semibold text-navy-900 sm:text-2xl">
            Product Master
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Brand, product and model combinations available when creating a job.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-4 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110">
          <Plus className="h-4 w-4" />
          Add Product
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search brand, product or model..."
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-navy-900 placeholder:text-slate-400 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-slate-200 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15">
          <option value="All">All statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
        {(search || statusFilter !== "All") && (
          <button
            type="button"
            onClick={() => {
              setSearch("");
              setStatusFilter("All");
            }}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-navy-900">
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={fetchProducts}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-red-600 hover:text-red-700">
            <RotateCcw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <th className="px-4 py-3 font-medium">S.No.</th>
                <th className="px-4 py-3 font-medium">Brand</th>
                <th className="px-4 py-3 font-medium">Product / Category</th>
                <th className="px-4 py-3 font-medium">Model</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <tr
                    key={i}
                    className="animate-pulse border-b border-slate-100 last:border-0">
                    <td colSpan={6} className="px-4 py-4">
                      <div className="h-4 w-full rounded bg-slate-100" />
                    </td>
                  </tr>
                ))}

              {!isLoading &&
                filtered.map((product, index) => (
                  <tr
                    key={product._id}
                    className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                    <td className="px-4 py-3.5 text-slate-500">{index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-navy-900">
                      {product.brand}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {product.productName}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">
                      {product.model}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={product.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => openEditModal(product)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-electric-500/10 hover:text-electric-500">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          title="Delete"
                          disabled={deletingId === product._id}
                          onClick={() => handleDelete(product._id)}
                          className="rounded-md p-1.5 text-slate-500 hover:bg-red-50 hover:text-red-500 disabled:opacity-50">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-sm text-slate-400">
                    No products found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-8">
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={() => setIsModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-navy-900">
                {form.id ? "Edit Product" : "Add Product"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-navy-900">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-900">
                  Brand <span className="text-red-500">*</span>
                </label>
                <input
                  name="brand"
                  required
                  value={form.brand}
                  onChange={handleChange}
                  placeholder="e.g. Aira"
                  className="w-full rounded-lg border border-gray-400 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-900">
                  Product / Category <span className="text-red-500">*</span>
                </label>
                <input
                  name="productName"
                  required
                  value={form.productName}
                  onChange={handleChange}
                  placeholder="e.g. Air Conditioner"
                  className="w-full rounded-lg border border-gray-400 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-900">
                  Model <span className="text-red-500">*</span>
                </label>
                <input
                  name="model"
                  required
                  value={form.model}
                  onChange={handleChange}
                  placeholder="e.g. AI-1.5T-SPL"
                  className="w-full rounded-lg border border-gray-400 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-navy-900">
                  Status
                </label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-400 bg-white py-2 px-3 text-sm text-navy-900 outline-none focus:border-electric-500 focus:ring-4 focus:ring-electric-500/15">
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              {formError && <p className="text-sm text-red-500">{formError}</p>}

              <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-lg bg-gradient-to-r from-electric-500 to-electric-400 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-electric-500/30 transition hover:brightness-110 disabled:opacity-70">
                  {isSaving
                    ? "Saving..."
                    : form.id
                      ? "Save Changes"
                      : "Create Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
