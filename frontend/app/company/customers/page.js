"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Users, ChevronDown, ChevronUp, Phone, MapPin } from "lucide-react";
import { getCustomersWithComplaints } from "@/actions/company";
import { STATUS_TONE } from "@/components/job/Constants";
import StatusBadge from "@/components/job/Statusbadge";

const CustomersPage = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expandedCustomer, setExpandedCustomer] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      setLoading(true);

      const res = await getCustomersWithComplaints();

      setCustomers(res.data?.data ?? []);
    } catch (error) {
      console.error("Failed to load customers:", error);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = useMemo(() => {
    const value = search.trim().toLowerCase();

    if (!value) return customers;

    return customers.filter((customer) => {
      return (
        customer.name?.toLowerCase().includes(value) ||
        customer.mobileNumber?.toLowerCase().includes(value) ||
        customer.alternateNumber?.toLowerCase().includes(value) ||
        customer.address?.toLowerCase().includes(value) ||
        customer.complaints?.some((job) =>
          job.complaintNumber?.toLowerCase().includes(value)
        )
      );
    });
  }, [customers, search]);

  const toggleCustomer = (id) => {
    setExpandedCustomer((current) =>
      current === id ? null : id
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-electric-500/10 text-electric-500">
            <Users className="h-5 w-5" />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-navy-900">
              Customers & Complaints
            </h1>

            <p className="text-sm text-slate-500">
              View customers created by your company and their complaint history.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search customer, mobile or complaint..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm text-navy-900 outline-none transition focus:border-electric-400 focus:ring-2 focus:ring-electric-500/10"
          />
        </div>

        <div className="text-sm text-slate-500">
          {filteredCustomers.length} customer
          {filteredCustomers.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
          <p className="text-sm text-slate-400">
            Loading customers...
          </p>
        </div>
      )}

      {/* Empty */}
      {!loading && filteredCustomers.length === 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
          <Users className="mx-auto h-10 w-10 text-slate-300" />

          <p className="mt-3 text-sm font-medium text-slate-600">
            No customers found
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Try changing your search.
          </p>
        </div>
      )}

      {/* Customers */}
      {!loading && filteredCustomers.length > 0 && (
        <div className="space-y-3">
          {filteredCustomers.map((customer) => {
            const isExpanded =
              expandedCustomer === customer._id;

            return (
              <div
                key={customer._id}
                className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
              >
                {/* Customer Header */}
                <button
                  type="button"
                  onClick={() => toggleCustomer(customer._id)}
                  className="flex w-full items-center justify-between gap-4 p-4 text-left hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h2 className="font-semibold text-navy-900">
                        {customer.name}
                      </h2>

                      <span className="rounded-full bg-electric-500/10 px-2 py-0.5 text-xs font-semibold text-electric-500">
                        {customer.complaintCount || 0} complaint
                        {customer.complaintCount !== 1 ? "s" : ""}
                      </span>
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      {customer.mobileNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5" />
                          {customer.mobileNumber}
                        </span>
                      )}

                      {customer.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" />
                          {customer.address}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-slate-400">
                    {isExpanded ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </div>
                </button>

                {/* Complaint History */}
                {isExpanded && (
                  <div className="border-t border-slate-100">
                    <div className="px-4 py-3">
                      <h3 className="text-sm font-semibold text-navy-900">
                        Complaint History
                      </h3>
                    </div>

                    {customer.complaints?.length === 0 ? (
                      <div className="border-t border-slate-100 px-4 py-6 text-center">
                        <p className="text-sm text-slate-400">
                          No complaints found for this customer.
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full min-w-[900px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="whitespace-nowrap px-4 py-3">
                                Complaint No.
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Date
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Product
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Issue
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Engineer
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Status
                              </th>

                              <th className="whitespace-nowrap px-4 py-3">
                                Solve Date
                              </th>
                            </tr>
                          </thead>

                          <tbody>
                            {customer.complaints.map((job) => (
                              <tr
                                key={job._id}
                                className="border-t border-slate-100 hover:bg-slate-50"
                              >
                                <td className="whitespace-nowrap px-4 py-3 font-medium text-navy-900">
                                  {job.complaintNumber || "-"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                  {job.complaintDate
                                    ? new Date(
                                        job.complaintDate
                                      ).toLocaleDateString("en-IN")
                                    : "-"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                  {[
                                    job.brand,
                                    job.product,
                                  ]
                                    .filter(Boolean)
                                    .join(" ") || "-"}
                                </td>

                                <td className="max-w-[250px] px-4 py-3 text-slate-600">
                                  <span
                                    className="block truncate"
                                    title={job.actualIssueFound || ""}
                                  >
                                    {job.actualIssueFound || "-"}
                                  </span>
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                  {job.assignedServiceEngineer?.name ||
                                    "-"}
                                </td>

                                <td className="whitespace-nowrap px-4 py-3">
                                  <StatusBadge
                                    status={job.status}
                                    tone={STATUS_TONE[job.status]}
                                  />
                                </td>

                                <td className="whitespace-nowrap px-4 py-3 text-slate-600">
                                  {job.solveDate
                                    ? new Date(
                                        job.solveDate
                                      ).toLocaleDateString("en-IN")
                                    : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CustomersPage;