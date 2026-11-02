using Daycare.Domain.Constants;
using Daycare.Domain.Entities;
using Daycare.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace Daycare.Infrastructure.Identity;

public static class IdentityDataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        using var scope = serviceProvider.CreateScope();
        var roleManager = scope.ServiceProvider.GetRequiredService<RoleManager<ApplicationRole>>();
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();
        var db = scope.ServiceProvider.GetService<DaycareDbContext>();
        var logger = scope.ServiceProvider.GetService<ILogger<ApplicationUser>>();

        // 1. Seed Roles
        foreach (var roleName in Roles.All)
        {
            if (!await roleManager.RoleExistsAsync(roleName))
            {
                await roleManager.CreateAsync(new ApplicationRole(roleName));
                logger?.LogInformation("Seeded role '{Role}'", roleName);
            }
        }

        // 2. Seed Admin Users
        await SeedUserAsync(userManager, db, logger, "admin@email.com", "Admin123!", "Admin", "User", Roles.Admin);
        await SeedUserAsync(userManager, db, logger, "admin@daycare.local", "Admin@Daycare2026!", "System", "Administrator", Roles.Admin);

        // 3. Ensure all Staff records have User accounts with MustChangePassword = true
        if (db != null)
        {
            var allStaff = await db.Staff
                .Where(s => !string.IsNullOrEmpty(s.Email))
                .ToListAsync();

            foreach (var staff in allStaff)
            {
                var staffUser = await userManager.FindByEmailAsync(staff.Email);
                if (staffUser is null)
                {
                    var cleanFirst = char.ToUpper(staff.FirstName.Trim()[0]) + (staff.FirstName.Trim().Length > 1 ? staff.FirstName.Trim()[1..].ToLowerInvariant().Replace(" ", "") : "");
                    var cleanLast = staff.LastName.Trim().ToLowerInvariant().Replace(" ", "");
                    var defaultPassword = $"{cleanFirst}.{cleanLast}1!";

                    var user = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = staff.Email.Trim().ToLowerInvariant(),
                        Email = staff.Email.Trim().ToLowerInvariant(),
                        FirstName = staff.FirstName,
                        LastName = staff.LastName,
                        StaffId = staff.Id,
                        MustChangePassword = true,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var targetRole = staff.StaffRole == StaffRole.Admin ? Roles.Admin : Roles.Staff;
                    var createResult = await userManager.CreateAsync(user, defaultPassword);
                    if (createResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(user, targetRole);
                        logger?.LogInformation("Auto-created login account for staff '{Email}' with default password", staff.Email);
                    }
                }
                else if (!staffUser.StaffId.HasValue)
                {
                    staffUser.StaffId = staff.Id;
                    await userManager.UpdateAsync(staffUser);
                }
            }

            // 4. Ensure all Children have Child-Credential User accounts with role Parent
            var allChildren = await db.Children.ToListAsync();
            foreach (var child in allChildren)
            {
                var cleanFirst = child.FirstName.Trim().ToLowerInvariant().Replace(" ", "");
                var cleanLast = child.LastName.Trim().ToLowerInvariant().Replace(" ", "");
                var childUsername = $"{cleanFirst}.{cleanLast}";
                var childEmail = $"{cleanFirst}.{cleanLast}@daycare.parent";
                var defaultPassword = "Child123!";

                var childUser = await userManager.Users.FirstOrDefaultAsync(u => u.ChildId == child.Id);

                if (childUser is null)
                {
                    var existingByName = await userManager.FindByNameAsync(childUsername);
                    if (existingByName != null)
                    {
                        childUsername = $"{cleanFirst}.{cleanLast}_{child.Id.ToString()[..4]}";
                        childEmail = $"{childUsername}@daycare.parent";
                    }

                    childUser = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = childUsername,
                        Email = childEmail,
                        FirstName = child.FirstName,
                        LastName = child.LastName,
                        ChildId = child.Id,
                        GuardianId = child.GuardianId,
                        MustChangePassword = false,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };

                    var createResult = await userManager.CreateAsync(childUser, defaultPassword);
                    if (createResult.Succeeded)
                    {
                        await userManager.AddToRoleAsync(childUser, Roles.Parent);
                        logger?.LogInformation("Auto-created child login account '{Username}' (password: {Password}) for child {First} {Last}", childUsername, defaultPassword, child.FirstName, child.LastName);
                    }
                    else
                    {
                        logger?.LogWarning("Failed to create child user '{Username}': {Errors}", childUsername, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                    }
                }
                else
                {
                    bool changed = false;
                    if (childUser.ChildId != child.Id)
                    {
                        childUser.ChildId = child.Id;
                        changed = true;
                    }
                    if (childUser.GuardianId != child.GuardianId)
                    {
                        childUser.GuardianId = child.GuardianId;
                        changed = true;
                    }
                    if (changed)
                    {
                        await userManager.UpdateAsync(childUser);
                    }

                    if (!await userManager.IsInRoleAsync(childUser, Roles.Parent))
                    {
                        await userManager.AddToRoleAsync(childUser, Roles.Parent);
                    }

                    if (!await userManager.CheckPasswordAsync(childUser, defaultPassword))
                    {
                        var token = await userManager.GeneratePasswordResetTokenAsync(childUser);
                        await userManager.ResetPasswordAsync(childUser, token, defaultPassword);
                    }
                }
            }

            // 5. Seed demo parent sarah.connor@example.com / parent123 if Sarah Connor guardian exists
            var sarahGuardian = await db.Guardians.FirstOrDefaultAsync(g => g.FirstName == "Sarah" && g.LastName == "Connor")
                                ?? await db.Guardians.FirstOrDefaultAsync();
            if (sarahGuardian != null)
            {
                var sarahUser = await userManager.FindByEmailAsync("sarah.connor@example.com");
                if (sarahUser is null)
                {
                    sarahUser = new ApplicationUser
                    {
                        Id = Guid.NewGuid(),
                        UserName = "sarah.connor@example.com",
                        Email = "sarah.connor@example.com",
                        FirstName = sarahGuardian.FirstName,
                        LastName = sarahGuardian.LastName,
                        GuardianId = sarahGuardian.Id,
                        MustChangePassword = false,
                        EmailConfirmed = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    var res = await userManager.CreateAsync(sarahUser, "parent123");
                    if (res.Succeeded)
                    {
                        await userManager.AddToRoleAsync(sarahUser, Roles.Parent);
                    }
                }
            }
        }
    }

    private static async Task SeedUserAsync(
        UserManager<ApplicationUser> userManager,
        DaycareDbContext? db,
        ILogger<ApplicationUser>? logger,
        string email,
        string password,
        string firstName,
        string lastName,
        string role)
    {
        Guid? staffId = null;
        if (db != null)
        {
            var staff = await db.Staff.FirstOrDefaultAsync(s => s.Email == email);
            if (staff == null)
            {
                staff = new Staff
                {
                    Id = Guid.NewGuid(),
                    FirstName = firstName,
                    LastName = lastName,
                    Email = email,
                    Phone = "123-456-7890",
                    Address = "Daycare Center",
                    StaffRole = StaffRole.Admin,
                    CreatedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow
                };
                db.Staff.Add(staff);
                await db.SaveChangesAsync();
            }
            staffId = staff.Id;
        }

        var existingUser = await userManager.FindByEmailAsync(email);
        if (existingUser is null)
        {
            var user = new ApplicationUser
            {
                Id = Guid.NewGuid(),
                UserName = email,
                Email = email,
                FirstName = firstName,
                LastName = lastName,
                StaffId = staffId,
                EmailConfirmed = true,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow
            };

            var createResult = await userManager.CreateAsync(user, password);
            if (createResult.Succeeded)
            {
                await userManager.AddToRoleAsync(user, role);
                logger?.LogInformation("Seeded user '{Email}' with role '{Role}'", email, role);
            }
            else
            {
                logger?.LogError("Failed to seed user '{Email}': {Errors}", email, string.Join(", ", createResult.Errors.Select(e => e.Description)));
            }
        }
        else
        {
            if (staffId.HasValue && existingUser.StaffId != staffId)
            {
                existingUser.StaffId = staffId;
                await userManager.UpdateAsync(existingUser);
                logger?.LogInformation("Linked staff ID '{StaffId}' to existing user '{Email}'", staffId, email);
            }

            if (!await userManager.IsInRoleAsync(existingUser, role))
            {
                await userManager.AddToRoleAsync(existingUser, role);
                logger?.LogInformation("Assigned role '{Role}' to existing user '{Email}'", role, email);
            }

            if (!await userManager.CheckPasswordAsync(existingUser, password))
            {
                var token = await userManager.GeneratePasswordResetTokenAsync(existingUser);
                var resetResult = await userManager.ResetPasswordAsync(existingUser, token, password);
                if (resetResult.Succeeded)
                {
                    logger?.LogInformation("Updated password for user '{Email}'", email);
                }
            }
        }
    }
}
