using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Daycare.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoUrlAndNewEntities : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Staff",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PhotoUrl",
                table: "Guardians",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "ChildAllergies",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChildId = table.Column<Guid>(type: "uuid", nullable: false),
                    AllergenName = table.Column<string>(type: "text", nullable: false),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    Reaction = table.Column<string>(type: "text", nullable: false),
                    HasEpiPen = table.Column<bool>(type: "boolean", nullable: false),
                    EpiPenLocation = table.Column<string>(type: "text", nullable: true),
                    ActionPlan = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChildAllergies", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChildAllergies_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ChildGuardians",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChildId = table.Column<Guid>(type: "uuid", nullable: false),
                    GuardianId = table.Column<Guid>(type: "uuid", nullable: false),
                    RelationshipType = table.Column<int>(type: "integer", nullable: false),
                    IsPrimary = table.Column<bool>(type: "boolean", nullable: false),
                    IsSecondary = table.Column<bool>(type: "boolean", nullable: false),
                    IsEmergencyContact = table.Column<bool>(type: "boolean", nullable: false),
                    EmergencyPriority = table.Column<int>(type: "integer", nullable: true),
                    IsAuthorizedPickup = table.Column<bool>(type: "boolean", nullable: false),
                    PickupPinHash = table.Column<string>(type: "text", nullable: true),
                    HasCustodyRestrictions = table.Column<bool>(type: "boolean", nullable: false),
                    CustodyNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChildGuardians", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChildGuardians_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ChildGuardians_Guardians_GuardianId",
                        column: x => x.GuardianId,
                        principalTable: "Guardians",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "Conversations",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    Type = table.Column<int>(type: "integer", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    ChildId = table.Column<Guid>(type: "uuid", nullable: true),
                    ClassroomId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    LastMessageAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastMessagePreview = table.Column<string>(type: "text", nullable: true),
                    LastMessageSenderName = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Conversations", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Conversations_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Conversations_Classrooms_ClassroomId",
                        column: x => x.ClassroomId,
                        principalTable: "Classrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ChildId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClassroomId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReportedByStaffId = table.Column<Guid>(type: "uuid", nullable: false),
                    IncidentTime = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    IncidentType = table.Column<string>(type: "text", nullable: false),
                    Location = table.Column<string>(type: "text", nullable: false),
                    Description = table.Column<string>(type: "text", nullable: false),
                    FirstAidAdministered = table.Column<string>(type: "text", nullable: false),
                    WitnessStaffNames = table.Column<string>(type: "text", nullable: true),
                    Severity = table.Column<int>(type: "integer", nullable: false),
                    ParentNotified = table.Column<bool>(type: "boolean", nullable: false),
                    ParentNotifiedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ParentNotifiedMethod = table.Column<string>(type: "text", nullable: false),
                    IsAcknowledgedByParent = table.Column<bool>(type: "boolean", nullable: false),
                    ParentAcknowledgedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    ParentSignatureName = table.Column<string>(type: "text", nullable: true),
                    ParentComments = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incidents_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Incidents_Classrooms_ClassroomId",
                        column: x => x.ClassroomId,
                        principalTable: "Classrooms",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_Incidents_Staff_ReportedByStaffId",
                        column: x => x.ReportedByStaffId,
                        principalTable: "Staff",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ChatMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderUserId = table.Column<Guid>(type: "uuid", nullable: false),
                    SenderName = table.Column<string>(type: "text", nullable: false),
                    SenderRole = table.Column<string>(type: "text", nullable: false),
                    SenderPhotoUrl = table.Column<string>(type: "text", nullable: true),
                    Body = table.Column<string>(type: "text", nullable: false),
                    ClientId = table.Column<string>(type: "text", nullable: true),
                    ReplyToMessageId = table.Column<Guid>(type: "uuid", nullable: true),
                    ReplyToPreview = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    EditedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsDeleted = table.Column<bool>(type: "boolean", nullable: false),
                    Status = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ChatMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ChatMessages_ChatMessages_ReplyToMessageId",
                        column: x => x.ReplyToMessageId,
                        principalTable: "ChatMessages",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_ChatMessages_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ConversationParticipants",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ConversationId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserId = table.Column<Guid>(type: "uuid", nullable: false),
                    UserName = table.Column<string>(type: "text", nullable: false),
                    UserRole = table.Column<string>(type: "text", nullable: false),
                    PhotoUrl = table.Column<string>(type: "text", nullable: true),
                    JoinedAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: false),
                    LeftAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    LastReadAt = table.Column<DateTime>(type: "timestamp without time zone", nullable: true),
                    IsMuted = table.Column<bool>(type: "boolean", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversationParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ConversationParticipants_Conversations_ConversationId",
                        column: x => x.ConversationId,
                        principalTable: "Conversations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ConversationId",
                table: "ChatMessages",
                column: "ConversationId");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_CreatedAt",
                table: "ChatMessages",
                column: "CreatedAt");

            migrationBuilder.CreateIndex(
                name: "IX_ChatMessages_ReplyToMessageId",
                table: "ChatMessages",
                column: "ReplyToMessageId");

            migrationBuilder.CreateIndex(
                name: "IX_ChildAllergies_ChildId",
                table: "ChildAllergies",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_ChildGuardians_ChildId_GuardianId",
                table: "ChildGuardians",
                columns: new[] { "ChildId", "GuardianId" });

            migrationBuilder.CreateIndex(
                name: "IX_ChildGuardians_GuardianId",
                table: "ChildGuardians",
                column: "GuardianId");

            migrationBuilder.CreateIndex(
                name: "IX_ConversationParticipants_ConversationId_UserId",
                table: "ConversationParticipants",
                columns: new[] { "ConversationId", "UserId" });

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ChildId",
                table: "Conversations",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_Conversations_ClassroomId",
                table: "Conversations",
                column: "ClassroomId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ChildId",
                table: "Incidents",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ClassroomId",
                table: "Incidents",
                column: "ClassroomId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_IncidentTime",
                table: "Incidents",
                column: "IncidentTime");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ReportedByStaffId",
                table: "Incidents",
                column: "ReportedByStaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ChatMessages");

            migrationBuilder.DropTable(
                name: "ChildAllergies");

            migrationBuilder.DropTable(
                name: "ChildGuardians");

            migrationBuilder.DropTable(
                name: "ConversationParticipants");

            migrationBuilder.DropTable(
                name: "Incidents");

            migrationBuilder.DropTable(
                name: "Conversations");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Staff");

            migrationBuilder.DropColumn(
                name: "PhotoUrl",
                table: "Guardians");
        }
    }
}
