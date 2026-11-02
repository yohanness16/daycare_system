using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Daycare.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddParentRoleAttendanceEnhancementsAndChildProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<List<string>>(
                name: "Allergies",
                table: "Children",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "BloodType",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<List<string>>(
                name: "DietaryRestrictions",
                table: "Children",
                type: "text[]",
                nullable: false,
                defaultValueSql: "'{}'");

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactName",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmergencyContactPhone",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "MedicalNotes",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Medications",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PediatricianName",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PediatricianPhone",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SpecialNeedsNotes",
                table: "Children",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Mood",
                table: "Attendances",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PickedUpBy",
                table: "Attendances",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "PickedUpByPickupId",
                table: "Attendances",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Attendances",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "UnverifiedPickup",
                table: "Attendances",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<Guid>(
                name: "GuardianId",
                table: "AspNetUsers",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastLoginAt",
                table: "AspNetUsers",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GuardianId",
                table: "AspNetUsers",
                column: "GuardianId",
                unique: true,
                filter: "\"GuardianId\" IS NOT NULL");

            migrationBuilder.AddForeignKey(
                name: "FK_AspNetUsers_Guardians_GuardianId",
                table: "AspNetUsers",
                column: "GuardianId",
                principalTable: "Guardians",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_AspNetUsers_Guardians_GuardianId",
                table: "AspNetUsers");

            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GuardianId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "Allergies",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "BloodType",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "DietaryRestrictions",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "EmergencyContactName",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "EmergencyContactPhone",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "MedicalNotes",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "Medications",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "PediatricianName",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "PediatricianPhone",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "SpecialNeedsNotes",
                table: "Children");

            migrationBuilder.DropColumn(
                name: "Mood",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "PickedUpBy",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "PickedUpByPickupId",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "UnverifiedPickup",
                table: "Attendances");

            migrationBuilder.DropColumn(
                name: "GuardianId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "LastLoginAt",
                table: "AspNetUsers");
        }
    }
}
