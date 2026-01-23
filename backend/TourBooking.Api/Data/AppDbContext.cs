using Microsoft.EntityFrameworkCore;

using TourBooking.Api.Models;

namespace TourBooking.Api.Data;

public sealed class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<Agreement> Agreements => Set<Agreement>();

    public DbSet<Bus> Buses => Set<Bus>();
    public DbSet<AgreementBusAssignment> AgreementBusAssignments => Set<AgreementBusAssignment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        var agreement = modelBuilder.Entity<Agreement>();
        agreement.HasKey(x => x.Id);

        agreement.Property(x => x.CustomerName).HasMaxLength(200).IsRequired();
        agreement.Property(x => x.Phone).HasMaxLength(50);

        agreement.Property(x => x.FromDate).HasMaxLength(20);
        agreement.Property(x => x.ToDate).HasMaxLength(20);

        agreement.Property(x => x.BusType).HasMaxLength(50);

        agreement.Property(x => x.PlacesToCover).HasMaxLength(2000);
        agreement.Property(x => x.Notes).HasMaxLength(4000);

	    agreement.Property(x => x.IsCancelled)
	        .HasDefaultValue(false);
	    agreement.Property(x => x.CancelledAtUtc);

        agreement.Property(x => x.TotalAmount).HasColumnType("decimal(18,2)");
        agreement.Property(x => x.AdvancePaid).HasColumnType("decimal(18,2)");
        agreement.Property(x => x.Balance).HasColumnType("decimal(18,2)");

        agreement.Property(x => x.PerDayRent).HasColumnType("decimal(18,2)");
        agreement.Property(x => x.IncludeMountainRent).HasDefaultValue(false);
        agreement.Property(x => x.MountainRent).HasColumnType("decimal(18,2)");
        agreement.Property(x => x.UseIndividualBusRates).HasDefaultValue(false);
        agreement.Property(x => x.BusRatesJson).HasMaxLength(8000);

        agreement.Property(x => x.CreatedAtUtc)
            .HasDefaultValueSql("GETUTCDATE()");

        var bus = modelBuilder.Entity<Bus>();
        bus.HasKey(x => x.Id);
        bus.Property(x => x.VehicleNumber).HasMaxLength(50).IsRequired();
        bus.HasIndex(x => x.VehicleNumber).IsUnique();
        bus.Property(x => x.Name).HasMaxLength(100);
        bus.Property(x => x.IsActive).HasDefaultValue(true);
        bus.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");

        var assignment = modelBuilder.Entity<AgreementBusAssignment>();
        assignment.HasKey(x => new { x.AgreementId, x.BusId });
        assignment.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
        assignment.HasIndex(x => x.BusId);

        assignment.HasOne(x => x.Agreement)
            .WithMany(x => x.BusAssignments)
            .HasForeignKey(x => x.AgreementId)
            .OnDelete(DeleteBehavior.Cascade);

        assignment.HasOne(x => x.Bus)
            .WithMany(x => x.AgreementAssignments)
            .HasForeignKey(x => x.BusId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
