import { AlertCircle, CheckCircle, Lock, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export type UserInitialFormState = {
  email: string;
  password: string;
  firstName: string;
  middleName: string;
  lastName: string;
  extension: string;
  birthDate: string;
  address: string;
  zipCode: string;
  contactNumber: string;
  employmentStatus: string;
};

type UserInitialFormProps = {
  formData: UserInitialFormState;
  onChange: (field: keyof UserInitialFormState, value: string) => void;
  onReset: () => void;
  onSubmit: () => void;
  isSaving?: boolean;
  error?: string;
  success?: boolean;
  successMessage: string;
  submitText: string;
  savingText: string;
  showAuthFields?: boolean;
  showEmploymentStatus?: boolean;
};

export const UserInitialForm = ({
  formData,
  onChange,
  onReset,
  onSubmit,
  isSaving = false,
  error,
  success,
  successMessage,
  submitText,
  savingText,
  showAuthFields = false,
  showEmploymentStatus = false,
}: UserInitialFormProps) => {
  return (
    <div className="space-y-4">
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-start gap-2">
          <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
          <p className="text-xs text-green-900">{successMessage}</p>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p className="text-xs text-red-900">{error}</p>
        </div>
      )}

      <div className="space-y-6">
        {showAuthFields && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-2 border-b">
              <Lock className="w-5 h-5" />
              <h3 className=" font-semibold">Authentication Credentials</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs" htmlFor="email">
                  Email *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter email address"
                  value={formData.email}
                  onChange={(event) => onChange("email", event.target.value)}
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>

              <div>
                <Label className="text-xs" htmlFor="password">
                  Password *
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter password (min 6 characters)"
                  value={formData.password}
                  onChange={(event) => onChange("password", event.target.value)}
                  className="mt-1"
                  disabled={isSaving}
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 pb-2 border-b">
            <User className="w-5 h-5" />
            <h3 className=" font-semibold">Personal Information</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs" htmlFor="firstName">
                First Name *
              </Label>
              <Input
                id="firstName"
                placeholder="Enter first name"
                value={formData.firstName}
                onChange={(event) => onChange("firstName", event.target.value)}
                onBlur={(event) =>
                  onChange("firstName", event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="middleName">
                Middle Name
              </Label>
              <Input
                id="middleName"
                placeholder="Enter middle name"
                value={formData.middleName}
                onChange={(event) => onChange("middleName", event.target.value)}
                onBlur={(event) =>
                  onChange(
                    "middleName",
                    event.target.value.trim().toUpperCase(),
                  )
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="lastName">
                Last Name *
              </Label>
              <Input
                id="lastName"
                placeholder="Enter last name"
                value={formData.lastName}
                onChange={(event) => onChange("lastName", event.target.value)}
                onBlur={(event) =>
                  onChange("lastName", event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="extension">
                Extension
              </Label>
              <Input
                id="extension"
                placeholder="e.g. JR., III"
                value={formData.extension}
                onChange={(event) => onChange("extension", event.target.value)}
                onBlur={(event) =>
                  onChange("extension", event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="birthDate">
                Birth Date *
              </Label>
              <Input
                id="birthDate"
                type="date"
                value={formData.birthDate}
                onChange={(event) => onChange("birthDate", event.target.value)}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="contactNumber">
                Contact Number
              </Label>
              <Input
                id="contactNumber"
                placeholder="Enter contact number"
                value={formData.contactNumber}
                onChange={(event) =>
                  onChange("contactNumber", event.target.value)
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div className="md:col-span-2">
              <Label className="text-xs" htmlFor="address">
                Address
              </Label>
              <Input
                id="address"
                placeholder="Enter address"
                value={formData.address}
                onChange={(event) => onChange("address", event.target.value)}
                onBlur={(event) =>
                  onChange("address", event.target.value.trim().toUpperCase())
                }
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            <div>
              <Label className="text-xs" htmlFor="zipCode">
                ZIP Code
              </Label>
              <Input
                id="zipCode"
                placeholder="Enter ZIP code"
                value={formData.zipCode}
                onChange={(event) => onChange("zipCode", event.target.value)}
                className="mt-1"
                disabled={isSaving}
              />
            </div>

            {showEmploymentStatus && (
              <div>
                <Label className="text-xs" htmlFor="employmentStatus">
                  Employment Status
                </Label>
                <select
                  id="employmentStatus"
                  value={formData.employmentStatus}
                  onChange={(event) =>
                    onChange("employmentStatus", event.target.value)
                  }
                  className="w-full mt-1 px-3 py-2 border border-input rounded-md bg-background text-foreground text-sm"
                  disabled={isSaving}
                >
                  <option value="FULL_TIME">Full Time</option>
                  <option value="PART_TIME">Part Time</option>
                </select>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onReset} disabled={isSaving}>
          Reset
        </Button>
        <Button onClick={onSubmit} disabled={isSaving}>
          {isSaving ? savingText : submitText}
        </Button>
      </div>
    </div>
  );
};
