import { useEffect } from "react";
import { useRouter } from "next/router";
import ProtectedRoute from "../../../../components/ProtectedRoute";
import AdminLayout from "../../../../components/layouts/AdminLayout";
import PageLayout from "../../../../components/layouts/PageLayout";
import { useForm } from "../../../../hooks/useForm";
import FormInput from "../../../../components/forms/FormInput";
import Button from "../../../../components/ui/Button";
import LoadingSpinner from "../../../../components/ui/LoadingSpinner";
import { useApi } from "../../../../hooks/useApi";
import { adminAPI } from "../../../../lib/api";
import toast, { Toaster } from "react-hot-toast";

export default function EditDistributor() {
  const router = useRouter();
  const { id } = router.query;
  const { data, loading, execute } = useApi(
    () => adminAPI.distributors.get(id),
    !!id
  );

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    handleSubmit,
    isSubmitting,
    setValues,
  } = useForm(
    {
      company_name: "",
      commission_rate: "",
      payment_terms: "",
      is_active: true,
    },
    async (formValues) => {
      try {
        await adminAPI.distributors.update(id, formValues);
        toast.success("Distributor updated successfully");
        router.push(`/admin/distributors/${id}`);
      } catch (error) {
        throw error;
      }
    }
  );

  useEffect(() => {
    if (data) {
      const distributor = data.data || data;
      setValues({
        company_name: distributor.company_name || "",
        commission_rate: distributor.commission_rate || "",
        payment_terms: distributor.payment_terms || "",
        is_active:
          distributor.is_active !== undefined ? distributor.is_active : true,
      });
    }
  }, [data, setValues]);

  if (loading) {
    return (
      <ProtectedRoute requiredRole="super_admin">
        <AdminLayout>
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredRole="super_admin">
      <AdminLayout title="Edit Distributor - Admin Panel">
        <Toaster />
        <PageLayout
          title="Edit Distributor"
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Distributors", href: "/admin/distributors" },
            { label: "Edit" },
          ]}
        >
          <div className="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <FormInput
                name="company_name"
                label="Company Name"
                value={values.company_name}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.company_name}
                touched={touched.company_name}
                required
              />

              <FormInput
                name="commission_rate"
                label="Commission Rate (%)"
                type="number"
                value={values.commission_rate}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.commission_rate}
                touched={touched.commission_rate}
                step="0.01"
                min="0"
                max="100"
              />

              <FormInput
                name="payment_terms"
                label="Payment Terms"
                value={values.payment_terms}
                onChange={handleChange}
                onBlur={handleBlur}
                error={errors.payment_terms}
                touched={touched.payment_terms}
              />

              <div className="flex justify-end space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancel
                </Button>
                <Button type="submit" loading={isSubmitting}>
                  Update Distributor
                </Button>
              </div>
            </form>
          </div>
        </PageLayout>
      </AdminLayout>
    </ProtectedRoute>
  );
}
