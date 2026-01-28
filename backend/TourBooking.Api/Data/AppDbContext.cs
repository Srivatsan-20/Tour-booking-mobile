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

	public DbSet<TripExpense> TripExpenses => Set<TripExpense>();
	public DbSet<BusExpense> BusExpenses => Set<BusExpense>();
	public DbSet<FuelEntry> FuelEntries => Set<FuelEntry>();
	public DbSet<OtherExpense> OtherExpenses => Set<OtherExpense>();

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

		// Accounts / expenses (1 Agreement -> 0..1 TripExpense)
		var tripExpense = modelBuilder.Entity<TripExpense>();
		tripExpense.HasKey(x => x.Id);
		tripExpense.HasIndex(x => x.AgreementId).IsUnique();
		tripExpense.Property(x => x.CreatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
		tripExpense.Property(x => x.UpdatedAtUtc).HasDefaultValueSql("GETUTCDATE()");
		tripExpense.HasOne(x => x.Agreement)
			.WithOne(x => x.TripExpense)
			.HasForeignKey<TripExpense>(x => x.AgreementId)
			.OnDelete(DeleteBehavior.Cascade);

		var busExpense = modelBuilder.Entity<BusExpense>();
		busExpense.HasKey(x => x.Id);
		busExpense.Property(x => x.DriverBatta).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
		busExpense.Property(x => x.Days).HasDefaultValue(0);
		busExpense.HasOne(x => x.TripExpense)
			.WithMany(x => x.BusExpenses)
			.HasForeignKey(x => x.TripExpenseId)
			.OnDelete(DeleteBehavior.Cascade);
		busExpense.HasOne(x => x.Bus)
			.WithMany()
			.HasForeignKey(x => x.BusId)
			.OnDelete(DeleteBehavior.SetNull);

		var fuel = modelBuilder.Entity<FuelEntry>();
		fuel.HasKey(x => x.Id);
		fuel.Property(x => x.Place).HasMaxLength(200);
		fuel.Property(x => x.Liters).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
		fuel.Property(x => x.Cost).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
		fuel.HasOne(x => x.BusExpense)
			.WithMany(x => x.FuelEntries)
			.HasForeignKey(x => x.BusExpenseId)
			.OnDelete(DeleteBehavior.Cascade);

		var other = modelBuilder.Entity<OtherExpense>();
		other.HasKey(x => x.Id);
		other.Property(x => x.Description).HasMaxLength(400);
		other.Property(x => x.Amount).HasColumnType("decimal(18,2)").HasDefaultValue(0m);
		other.HasOne(x => x.BusExpense)
			.WithMany(x => x.OtherExpenses)
			.HasForeignKey(x => x.BusExpenseId)
			.OnDelete(DeleteBehavior.Cascade);

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
