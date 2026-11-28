import type { CollectionConfig } from "payload";

export const Users: CollectionConfig = {
  slug: "users",

  auth: true,

  admin: {
    useAsTitle: "displayName",
    defaultColumns: ["email", "role", "createdAt"],
  },

  access: {
    read: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return { id: { equals: user.id } };
    },
    update: ({ req: { user } }) => {
      if (!user) return false;
      if (user.role === "admin") return true;
      return { id: { equals: user.id } };
    },
    delete: ({ req: { user } }) => user?.role === "admin" || false,
  },

  fields: [
    /* ---------------------------
     * Roles (WooCommerce: role)
     * --------------------------- */
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "student",
      options: [
        { label: "Admin", value: "admin" },
        { label: "Student", value: "student" },
        { label: "Instructor", value: "instructor" },
      ],
      saveToJWT: true,
    },
    { name: "displayName", label: "Display Name", type: "text" },
    /* ---------------------------
     * Profile
     * --------------------------- */
    {
      type: "group",
      name: "profile",
      fields: [
        { name: "firstName", type: "text" },
        { name: "lastName", type: "text" },
        {
          name: "avatar",
          type: "upload",
          relationTo: "media",
          admin: {
            position: "sidebar",
          }
        },
        {
          name: "phone",
          type: "text",
          index: true,
        },
        {
          name: "bio",
          type: "textarea",
          admin: {
            description: "Short biography or description of the user.",
          },
        }
      ],
    },

    /* ---------------------------
     * Billing Address (Woo)
     * --------------------------- */
    {
      type: "group",
      name: "billing",
      fields: [
        { name: "firstName", type: "text" },
        { name: "lastName", type: "text" },
        { name: "company", type: "text" },
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
        { name: "email", type: "email" },
        { name: "phone", type: "text" },
      ],
    },

    /* ---------------------------
     * Shipping Address (Woo)
     * --------------------------- */
    {
      type: "group",
      name: "shipping",
      fields: [
        { name: "firstName", type: "text" },
        { name: "lastName", type: "text" },
        { name: "company", type: "text" },
        { name: "address1", type: "text" },
        { name: "address2", type: "text" },
        { name: "city", type: "text" },
        { name: "state", type: "text" },
        { name: "postcode", type: "text" },
        { name: "country", type: "text" },
      ],
    },

    /* ---------------------------
     * Account Status
     * --------------------------- */
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Active", value: "active" },
        { label: "Blocked", value: "blocked" },
        { label: "Pending", value: "pending" },
      ],
    },

    /* ---------------------------
     * Metadata (Woo meta_data)
     * --------------------------- */
    {
      name: "meta",
      type: "json",
      admin: {
        description: "Custom user metadata (non-indexed)",
      },
    },
  ],

  timestamps: true,
};
