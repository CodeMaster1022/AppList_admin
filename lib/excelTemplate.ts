import * as XLSX from 'xlsx';

export interface ChecklistTemplateRow {
  lane: string;
  subArea: string;
  role: string;
  checklistTitle: string;
  activityName: string;
  requiresPhoto: string; // 'Yes' or 'No'
  activityRecurrence?: string;
  generalRecurrence?: string;
  order: number;
}

export function generateExcelTemplate(): void {
  // Create sample data structure
  const sampleData: ChecklistTemplateRow[] = [
    {
      lane: 'Operations',
      subArea: 'Reception',
      role: 'Hosts',
      checklistTitle: 'Checklist Reception - Hosts',
      activityName: 'Verify cleanliness of reception area',
      requiresPhoto: 'Yes',
      activityRecurrence: '',
      generalRecurrence: 'Daily',
      order: 1,
    },
    {
      lane: 'Operations',
      subArea: 'Reception',
      role: 'Hosts',
      checklistTitle: 'Checklist Reception - Hosts',
      activityName: 'Check table availability',
      requiresPhoto: 'No',
      activityRecurrence: '',
      generalRecurrence: 'Daily',
      order: 2,
    },
    {
      lane: 'Kitchen',
      subArea: 'Hot Kitchen',
      role: 'Chef',
      checklistTitle: 'Checklist Kitchen - Chef',
      activityName: 'Verify equipment temperature',
      requiresPhoto: 'Yes',
      activityRecurrence: 'Every 3 days',
      generalRecurrence: 'Daily',
      order: 1,
    },
  ];

  // Create workbook
  const wb = XLSX.utils.book_new();

  // Create worksheet from data
  const ws = XLSX.utils.json_to_sheet(sampleData);

  // Set column widths
  const colWidths = [
    { wch: 15 }, // lane
    { wch: 20 }, // subArea
    { wch: 15 }, // role
    { wch: 30 }, // checklistTitle
    { wch: 40 }, // activityName
    { wch: 12 }, // requiresPhoto
    { wch: 18 }, // activityRecurrence
    { wch: 18 }, // generalRecurrence
    { wch: 8 },  // order
  ];
  ws['!cols'] = colWidths;

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, 'Checklists');

  // Create instructions sheet
  const instructions = [
    ['INSTRUCTIONS FOR COMPLETING THE TEMPLATE'],
    [],
    ['1. Lane:', 'Name of the operational lane (E.g: Operations, Kitchen, etc.)'],
    ['2. Sub-area:', 'Name of the sub-area within the lane'],
    ['3. Role:', 'Role to which the checklist is assigned'],
    ['4. Checklist Title:', 'Descriptive name of the checklist'],
    ['5. Activity Name:', 'Description of the activity to be performed'],
    ['6. Requires Photo:', 'Yes or No - indicates if the activity requires mandatory photo'],
    ['7. Activity Recurrence:', 'Optional - special recurrence for this activity'],
    ['8. General Recurrence:', 'Recurrence applied to the entire checklist'],
    ['9. Order:', 'Order number of the activity within the checklist'],
    [],
    ['NOTES:'],
    ['- You can create multiple checklists in the same sheet'],
    ['- Each row represents an activity'],
    ['- Activities with the same checklist title belong to the same checklist'],
    ['- The order determines the sequence of activities'],
  ];

  const wsInstructions = XLSX.utils.aoa_to_sheet(instructions);
  wsInstructions['!cols'] = [{ wch: 30 }, { wch: 60 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, 'Instructions');

  // Generate filename with timestamp
  const filename = `checklist_template_${new Date().toISOString().split('T')[0]}.xlsx`;

  // Write file
  XLSX.writeFile(wb, filename);
}

