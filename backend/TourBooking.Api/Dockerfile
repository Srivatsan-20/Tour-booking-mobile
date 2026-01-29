# Use the official ASP.NET Core SDK image to build the app
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj and restore dependencies
COPY ["TourBooking.Api.csproj", "./"]
RUN dotnet restore "TourBooking.Api.csproj"

# Copy the rest of the source code
COPY . .

# Build the application
RUN dotnet build "TourBooking.Api.csproj" -c Release -o /app/build

# Publish the application
FROM build AS publish
RUN dotnet publish "TourBooking.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Use the lighter run-time image for the final container
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 8080
ENV USER_NAME=tourbooking

# Copy published files from the build stage
COPY --from=publish /app/publish .

# Set entry point
ENTRYPOINT ["dotnet", "TourBooking.Api.dll"]
