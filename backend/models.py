
from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    report_text: str = Field(min_length=5, max_length=5000)
    source: str = "manual"


class IncidentUpdate(BaseModel):
    incident_type: str | None = None
    location: str | None = None
    people_affected: int | None = Field(default=None, ge=0)
    needs: list[str] | None = None
    urgency: str | None = None
    status: str | None = None


class ResourceCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    resource_type: str = Field(min_length=1, max_length=50)
    quantity_available: int = Field(ge=0)
    unit: str = "units"
    location: str = "unknown"
