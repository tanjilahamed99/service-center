"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Plus,
  Search,
  SlidersHorizontal,
  X,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  Eye,
  EyeOff,
  Users,
  ShieldCheck,
  Building2,
  Wrench,
  HardHat,
  ChevronDown,
} from "lucide-react";
import { createUsers, getUsers } from "@/actions/admin";
import { toast } from "sonner";
import { formatDate } from "@/components/FormatDate";

const ROLE_CONFIG = {
  admin: {
    label: "Admin",
    icon: ShieldCheck,
  },
};

const EMPTY_FORM = {
  name: "",
  email: "",
  phone: "",
  role: "admin",
  password: "",
};

export default function UsersPage() {
  const [users, setUsers] = useState([]);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showFilters, setShowFilters] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [form, setForm] = useState(EMPTY_FORM);
  const [showPassword, setShowPassword] = useState(false);

  // =====================================================
  // FILTER USERS
  // =====================================================

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchValue = search.toLowerCase().trim();

      const matchesSearch =
        !searchValue ||
        user.name.toLowerCase().includes(searchValue) ||
        user.email.toLowerCase().includes(searchValue) ||
        user.phone.includes(searchValue);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      const matchesStatus =
        statusFilter === "all" || user.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  // =====================================================
  // OPEN CREATE MODAL
  // =====================================================

  const handleCreate = () => {
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
    setShowModal(true);
  };

  // =====================================================
  // OPEN EDIT MODAL
  // =====================================================

  const handleEdit = (user) => {
    setEditingUser(user);

    setForm({
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      password: "",
    });

    setShowPassword(false);
    setShowModal(true);
  };

  // =====================================================
  // CLOSE MODAL
  // =====================================================

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setForm(EMPTY_FORM);
    setShowPassword(false);
  };

  // =====================================================
  // FORM CHANGE
  // =====================================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // =====================================================
  // CREATE / UPDATE
  // =====================================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (editingUser) {
      setUsers((prev) =>
        prev.map((user) =>
          user.id === editingUser.id
            ? {
                ...user,
                name: form.name,
                email: form.email,
                phone: form.phone,
                role: form.role,
              }
            : user,
        ),
      );


      // const {data} = await updateUserData({id})




    } else {
      const newUser = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
      };
      const { data } = await createUsers(newUser);
      if (data.success) {
        setUsers((prev) => [data.data, ...prev]);
        toast.success("Login successful");
      }
    }

    closeModal();
  };

  // =====================================================
  // DELETE
  // =====================================================

  const handleDelete = (user) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete ${user.name}?`,
    );

    if (!confirmed) return;

    setUsers((prev) => prev.filter((item) => item.id !== user.id));
  };

  // =====================================================
  // TOGGLE STATUS
  // =====================================================

  const handleToggleStatus = (user) => {
    setUsers((prev) =>
      prev.map((item) =>
        item.id === user.id
          ? {
              ...item,
              status: item.status === "Active" ? "Inactive" : "Active",
            }
          : item,
      ),
    );
  };

  // =====================================================
  // ROLE ICON
  // =====================================================

  const RoleIcon = ({ role }) => {
    const Icon = ROLE_CONFIG[role]?.icon || Users;

    return <Icon size={15} strokeWidth={1.8} />;
  };

  useEffect(() => {
    const fetchUsers = async () => {
      const { data } = await getUsers();
      if (data.success) {
        setUsers(data.data);
      }
    };

    fetchUsers();
  }, []);

  return (
    <div className="space-y-6">
      {/* ================================================= */}
      {/* PAGE HEADER */}
      {/* ================================================= */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-500/10 text-electric-500 ring-1 ring-electric-400/20">
              <Users size={21} strokeWidth={1.8} />
            </div>

            <div>
              <h2 className="text-xl font-semibold text-navy-900">Admins</h2>

              <p className="text-sm text-slate-500">
                Manage all system admin and their access.
              </p>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCreate}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric-500 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-400/40">
          <Plus size={18} strokeWidth={2} />
          Create Admin
        </button>
      </div>

      {/* ================================================= */}
      {/* STATS */}
      {/* ================================================= */}

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="Admins"
          value={users.filter((user) => user.role === "admin").length}
          icon={ShieldCheck}
        />

        <StatCard
          label="Active Admins"
          value={users.filter((user) => user.status === "Active").length}
          icon={UserCheck}
        />
      </div>

      {/* ================================================= */}
      {/* TABLE CARD */}
      {/* ================================================= */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        {/* Search + filters */}
        <div className="border-b border-slate-200 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                strokeWidth={1.8}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search users by name, email or phone..."
                className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10"
              />
            </div>

            {/* Filter button mobile */}
            <button
              type="button"
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium text-slate-600 transition hover:bg-slate-50 lg:hidden">
              <SlidersHorizontal size={17} />
              Filters
            </button>

            {/* Desktop filters */}
            <div className="hidden gap-2 lg:flex">
              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  {
                    value: "all",
                    label: "All Status",
                  },
                  {
                    value: "active",
                    label: "Active",
                  },
                  {
                    value: "inactive",
                    label: "Inactive",
                  },
                ]}
              />
            </div>
          </div>

          {/* Mobile filters */}
          {showFilters && (
            <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
              <FilterSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={[
                  {
                    value: "all",
                    label: "All Roles",
                  },
                  {
                    value: "admin",
                    label: "Admin",
                  },
                  {
                    value: "company",
                    label: "Company",
                  },
                  {
                    value: "service-center",
                    label: "Service Center",
                  },
                  {
                    value: "service-engineer",
                    label: "Service Engineer",
                  },
                ]}
              />

              <FilterSelect
                value={statusFilter}
                onChange={setStatusFilter}
                options={[
                  {
                    value: "all",
                    label: "All Status",
                  },
                  {
                    value: "active",
                    label: "Active",
                  },
                  {
                    value: "inactive",
                    label: "Inactive",
                  },
                ]}
              />
            </div>
          )}
        </div>

        {/* ================================================= */}
        {/* TABLE */}
        {/* ================================================= */}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  User
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Contact
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Role
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>

                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Created
                </th>

                <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user, idx) => (
                  <tr
                    key={idx}
                    className="group transition hover:bg-slate-50/80">
                    {/* User */}
                    <td className="px-5 py-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-navy-900 text-xs font-semibold text-white">
                          {user.name
                            .split(" ")
                            .map((word) => word[0])
                            .slice(0, 2)
                            .join("")
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="max-w-[220px] truncate text-sm font-semibold text-navy-900">
                            {user.name}
                          </p>

                          <p className="max-w-[220px] truncate text-xs text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap text-sm text-slate-600">
                        {user.phone}
                      </span>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span className="inline-flex max-w-[180px] items-center gap-1.5 whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600">
                        <RoleIcon role={user.role} />

                        {ROLE_CONFIG[user.role]?.label || user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${
                          user.status === "active"
                            ? "bg-emerald-50 text-emerald-600"
                            : "bg-slate-100 text-slate-500"
                        }`}>
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${
                            user.status === "active"
                              ? "bg-emerald-500"
                              : "bg-slate-400"
                          }`}
                        />

                        {user.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* Created */}
                    <td className="px-5 py-4">
                      <span className="whitespace-nowrap text-sm text-slate-500">
                        {formatDate(user.createdAt)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        {/* Edit */}
                        <ActionButton
                          title="Edit"
                          onClick={() => handleEdit(user)}>
                          <Pencil size={16} />
                        </ActionButton>

                        {/* Enable / Disable */}
                        <ActionButton
                          title={
                            user.status === "active"
                              ? "Disable user"
                              : "Enable user"
                          }
                          onClick={() => handleToggleStatus(user)}
                          className={
                            user.status === "active"
                              ? "hover:text-amber-600"
                              : "hover:text-emerald-600"
                          }>
                          {user.status === "active" ? (
                            <UserX size={16} />
                          ) : (
                            <UserCheck size={16} />
                          )}
                        </ActionButton>

                        {/* Delete */}
                        <ActionButton
                          title="Delete"
                          onClick={() => handleDelete(user)}
                          className="hover:bg-red-50 hover:text-red-600">
                          <Trash2 size={16} />
                        </ActionButton>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                        <Users size={22} />
                      </div>

                      <p className="text-sm font-semibold text-navy-900">
                        No users found
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        Try changing your search or filters.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div className="flex flex-col gap-2 border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Showing{" "}
            <strong className="font-semibold text-slate-700">
              {filteredUsers.length}
            </strong>{" "}
            of{" "}
            <strong className="font-semibold text-slate-700">
              {users.length}
            </strong>{" "}
            users
          </span>
        </div>
      </div>

      {/* ================================================= */}
      {/* CREATE / EDIT MODAL */}
      {/* ================================================= */}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm"
            onClick={closeModal}
          />

          {/* Modal */}
          <div className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-5 py-4 sm:px-6">
              <div>
                <h3 className="text-lg font-semibold text-navy-900">
                  {editingUser ? "Edit User" : "Create New User"}
                </h3>

                <p className="mt-0.5 text-sm text-slate-500">
                  {editingUser
                    ? "Update user information and access."
                    : "Add a new user to your system."}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
              {/* Name */}
              <FormField label="Name" required>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10"
                />
              </FormField>

              {/* Email */}
              <FormField label="Email" required>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter email address"
                  required
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10"
                />
              </FormField>

              {/* Phone */}
              <FormField label="Phone Number">
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="Enter phone number"
                  className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10"
                />
              </FormField>

              {/* Password */}
              {!editingUser && (
                <FormField label="Password" required>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Enter password"
                      required
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10 pr-11"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }>
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>
              )}

              {/* Edit password */}
              {editingUser && (
                <FormField label="New Password">
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      placeholder="Leave empty to keep current password"
                      className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-electric-400 focus:bg-white focus:ring-2 focus:ring-electric-400/10 pr-11"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </FormField>
              )}

              {/* Actions */}
              <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50">
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-electric-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-electric-600 focus:outline-none focus:ring-2 focus:ring-electric-400/40">
                  {editingUser ? (
                    <>
                      <Pencil size={16} />
                      Update User
                    </>
                  ) : (
                    <>
                      <Plus size={17} />
                      Create User
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// =======================================================
// STAT CARD
// =======================================================

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-slate-500">{label}</p>

          <p className="mt-1 text-xl font-bold text-navy-900">{value}</p>
        </div>

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-electric-500/10 text-electric-500">
          <Icon size={18} strokeWidth={1.8} />
        </div>
      </div>
    </div>
  );
}

// =======================================================
// FILTER SELECT
// =======================================================

function FilterSelect({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 min-w-[150px] appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm font-medium text-slate-600 outline-none transition hover:bg-slate-50 focus:border-electric-400 focus:ring-2 focus:ring-electric-400/10">
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>

      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

// =======================================================
// ACTION BUTTON
// =======================================================

function ActionButton({ children, title, onClick, className = "" }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={`flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-electric-600 ${className}`}>
      {children}
    </button>
  );
}

// =======================================================
// FORM FIELD
// =======================================================

function FormField({ label, required, children }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">
        {label}

        {required && <span className="ml-1 text-red-500">*</span>}
      </label>

      {children}
    </div>
  );
}
