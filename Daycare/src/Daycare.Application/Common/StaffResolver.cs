using Daycare.Application.Interfaces;
using Daycare.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace Daycare.Application.Common;

public static class StaffResolver
{
    public static async Task<Staff> ResolveStaffAsync(
        IDaycareDbContext db,
        ICurrentUserService? currentUserService,
        Guid? explicitStaffId,
        CancellationToken cancellationToken = default)
    {
        ArgumentNullException.ThrowIfNull(db);

        // 1. If explicit staff ID was provided in request
        if (explicitStaffId.HasValue && explicitStaffId.Value != Guid.Empty)
        {
            var explicitStaff = await db.Staff
                .FirstOrDefaultAsync(s => s.Id == explicitStaffId.Value, cancellationToken);

            if (explicitStaff is null)
            {
                throw new KeyNotFoundException($"Staff member with ID '{explicitStaffId.Value}' was not found.");
            }

            return explicitStaff;
        }

        // 2. Try resolving via current user's StaffId claim
        if (currentUserService?.StaffId.HasValue == true && currentUserService.StaffId.Value != Guid.Empty)
        {
            var staff = await db.Staff
                .FirstOrDefaultAsync(s => s.Id == currentUserService.StaffId.Value, cancellationToken);

            if (staff != null)
            {
                return staff;
            }
        }

        // 3. Try resolving via current user's Email
        if (!string.IsNullOrWhiteSpace(currentUserService?.Email))
        {
            var normalizedEmail = currentUserService.Email.Trim().ToLowerInvariant();
            var staff = await db.Staff
                .FirstOrDefaultAsync(s => s.Email.ToLower() == normalizedEmail, cancellationToken);

            if (staff != null)
            {
                return staff;
            }
        }

        // 4. If current user is Admin, fallback to an existing Admin staff profile or auto-create one
        if (currentUserService?.IsAdmin == true)
        {
            var adminStaff = await db.Staff
                .FirstOrDefaultAsync(s => s.StaffRole == StaffRole.Admin, cancellationToken);

            if (adminStaff != null)
            {
                return adminStaff;
            }

            var newAdminStaff = new Staff
            {
                Id = Guid.NewGuid(),
                FirstName = "System",
                LastName = "Administrator",
                Email = currentUserService.Email ?? "admin@daycare.local",
                Phone = "123-456-7890",
                Address = "Daycare HQ",
                StaffRole = StaffRole.Admin,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            db.Staff.Add(newAdminStaff);
            await db.SaveChangesAsync(cancellationToken);
            return newAdminStaff;
        }

        throw new InvalidOperationException(
            "Could not resolve the logged-in staff member. Please ensure your account is associated with a staff record or supply an explicit staff ID.");
    }
}
