import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req: { user } }) => user?.role === 'admin'

export const isAdminField: FieldAccess = ({ req: { user } }) => user?.role === 'admin'

export const isAdminOrInstructor: Access = ({ req: { user } }) =>
  user?.role === 'admin' || user?.role === 'instructor'

export const isAuthenticated: Access = ({ req: { user } }) => Boolean(user)

export const isCustomer: FieldAccess = ({ req: { user } }) =>
  Boolean(user && user.role !== 'admin')

export const isDocumentOwner: Access = ({ req: { user } }) => {
  if (!user) return false
  if (user.role === 'admin') return true
  return { customer: { equals: user.id } }
}

export const adminOrPublishedStatus: Access = ({ req: { user } }) => {
  if (user?.role === 'admin') return true
  return { _status: { equals: 'published' } }
}

export const publicAccess: Access = () => true
