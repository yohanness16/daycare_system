namespace Daycare.Application.DTOs.Parent;

public class ParentWellbeingOverviewResponse
{
    public Guid ChildId { get; set; }
    public string From { get; set; } = string.Empty;
    public string To { get; set; } = string.Empty;
    public ParentWellbeingScore Score { get; set; } = new();
    public ParentWellbeingMoodStats Mood { get; set; } = new();
    public ParentWellbeingSleepStats Sleep { get; set; } = new();
    public ParentWellbeingNutritionStats Nutrition { get; set; } = new();
    public ParentWellbeingAttendanceStats Attendance { get; set; } = new();
    public ParentWellbeingHealthStats Health { get; set; } = new();
    public ParentWellbeingIncidentStats Incidents { get; set; } = new();
    public IReadOnlyList<ParentWellbeingFlag> Flags { get; set; } = Array.Empty<ParentWellbeingFlag>();
    public string Disclaimer { get; set; } = "Insights reflect daycare observations and daily logged activities.";
}

public class ParentWellbeingScore
{
    public int Value { get; set; } = 92;
    public string Label { get; set; } = "Thriving & Content";
    public string Explanation { get; set; } = "Consistent positive participation in sensory and group play, balanced appetite, and peaceful rest periods.";
}

public class ParentWellbeingMoodStats
{
    public double Average { get; set; } = 1.2;
    public Dictionary<string, int> Distribution { get; set; } = new()
    {
        { "VeryHappy", 6 },
        { "Happy", 4 },
        { "Calm", 3 },
        { "Tired", 1 }
    };
    public string Trend { get; set; } = "Stable";
}

public class ParentWellbeingSleepStats
{
    public double AvgMinutesPerDay { get; set; } = 85.0;
    public double AvgNaps { get; set; } = 1.0;
    public string Trend { get; set; } = "Consistent 75-90 min afternoon naps.";
}

public class ParentWellbeingNutritionStats
{
    public double EatenRate { get; set; } = 88.0;
    public double PartialRate { get; set; } = 10.0;
    public double NotEatenRate { get; set; } = 2.0;
    public string Trend { get; set; } = "Eats full portions of wholesome lunches and snacks.";
}

public class ParentWellbeingAttendanceStats
{
    public int PresentDays { get; set; } = 10;
    public int AbsentDays { get; set; } = 0;
    public int LateDays { get; set; } = 1;
}

public class ParentWellbeingHealthStats
{
    public int IllnessEvents { get; set; } = 0;
    public decimal? MaxTemperature { get; set; } = 36.8m;
    public int MedicationDoses { get; set; } = 0;
}

public class ParentWellbeingIncidentStats
{
    public int Total { get; set; } = 0;
    public int Unacknowledged { get; set; } = 0;
}

public class ParentWellbeingFlag
{
    public string Type { get; set; } = "Observation";
    public string Severity { get; set; } = "Info";
    public string Message { get; set; } = string.Empty;
}
