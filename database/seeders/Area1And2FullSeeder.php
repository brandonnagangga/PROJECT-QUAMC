<?php

namespace Database\Seeders;

use App\Models\AccreditationCycle;
use App\Models\Area;
use App\Models\AreaItem;
use App\Models\AreaItemResponse;
use App\Models\Program;
use App\Models\SubArea;
use Illuminate\Database\Seeder;

class Area1And2FullSeeder extends Seeder
{
    public function run(): void
    {
        $program = Program::first();
        if (!$program) {
            $this->command->error('No program found. Run ProgramAndAreaSeeder first.');
            return;
        }

        $cycle = AccreditationCycle::active();
        $cycleId = $cycle?->id;

        $this->command->info("Seeding responses for program: {$program->name}");

        $areasData = [
            'Governance and Administration' => $this->area1Data(),
            'Faculty' => $this->area2Data(),
        ];

        foreach ($areasData as $areaKeyword => $data) {
            $area = Area::where('name', 'like', "%{$areaKeyword}%")->first();
            if (!$area) {
                $this->command->warn("Area {$areaKeyword} not found.");
                continue;
            }

            foreach ($data as $subAreaName => $ipoData) {
                $subArea = SubArea::where('area_id', $area->id)
                    ->where('name', 'like', "%" . $this->keyword($subAreaName) . "%")
                    ->first();

                // Handle 'Salaries and Fringe Benefits' vs 'Salaries and Benefits'
                if (!$subArea && str_contains($subAreaName, 'Salaries')) {
                     $subArea = SubArea::where('area_id', $area->id)->where('name', 'like', "%Salaries%")->first();
                }

                if (!$subArea) {
                    $this->command->warn("  Sub-area not found: {$subAreaName}");
                    continue;
                }

                // Clear existing items AND responses for this sub-area
                $itemIds = AreaItem::where('sub_area_id', $subArea->id)->pluck('id');
                AreaItemResponse::whereIn('area_item_id', $itemIds)->delete();
                AreaItem::where('sub_area_id', $subArea->id)->delete();
                $this->command->info("  Re-seeding: {$subArea->name}");

                foreach (['input', 'process', 'outcome'] as $ipo) {
                    $items = $ipoData[$ipo] ?? [];
                    $parentOrder = 0;

                    foreach ($items as $criterionText => $subItems) {
                        $parentOrder++;

                        // Label = short identifier (Item 1, Item 2, ...)
                        $parent = AreaItem::create([
                            'sub_area_id'    => $subArea->id,
                            'ipo_type'       => $ipo,
                            'parent_item_id' => null,
                            'label'          => "Item {$parentOrder}",
                            'order_number'   => $parentOrder,
                        ]);

                        // Narrative = actual criterion text seeded as coordinator response
                        AreaItemResponse::create([
                            'area_item_id' => $parent->id,
                            'program_id'   => $program->id,
                            'cycle_id'     => $cycleId,
                            'content_text' => $criterionText,
                            'rating'       => null,
                        ]);

                        if (is_array($subItems) && !empty($subItems)) {
                            $childOrder = 0;
                            foreach ($subItems as $childText) {
                                $childOrder++;
                                // e.g., Sub-item a, Sub-item b
                                // Use alphabetical character, but if it exceeds 'z', wrap around or just use numbers. Usually < 26.
                                $childLabel = 'Sub-item ' . (ctype_alpha(chr(96 + $childOrder)) ? chr(96 + $childOrder) : $childOrder);
                                
                                $child = AreaItem::create([
                                    'sub_area_id'    => $subArea->id,
                                    'ipo_type'       => $ipo,
                                    'parent_item_id' => $parent->id,
                                    'label'          => $childLabel,
                                    'order_number'   => $childOrder,
                                ]);

                                // Seed child narrative too
                                AreaItemResponse::create([
                                    'area_item_id' => $child->id,
                                    'program_id'   => $program->id,
                                    'cycle_id'     => $cycleId,
                                    'content_text' => $childText,
                                    'rating'       => null,
                                ]);
                            }
                        }
                    }
                }
            }
        }

        $this->command->info("Area 1 & 2 Full Seeding Done.");
    }

    private function keyword(string $name): string
    {
        $parts   = explode(':', $name, 2);
        $keyword = trim($parts[1] ?? $parts[0]);
        return implode(' ', array_slice(explode(' ', $keyword), 0, 2));
    }

    private function area1Data(): array
    {
        return [
            'Administrative Organization' => [
                'input' => [
                    'The Board of Regents/Board of Trustees which is the policy making body of the school is chaired by the Local Chief Executive or his duly designated representative and vice-chaired by the President of the University/College.' => [],
                    'The Board includes at least seven Members of the Board shall include Distinguished Citizens, of the Local Community, the Academe, the Sanggunian, Industry Partners, Stakeholders, and other appropriate sectoral representation, or whichever is required by the Charter or the ordinance of the institution.' => [],
                    'The administrative officials include the following:' => ['President', 'Vice President/s', 'Finance/ Budget Officer', 'Accountant', 'Human Resource Manager', 'Registrar'],
                ],
                'process' => [
                    'The institution, through its governing structure, conducts annual planning that includes all sectors of the institution in order to:' => ['review and revisit its Vision, Mission, Goals and Objectives (VMGO);', 'formulate and provide Annual Investment Plan, Annual Procurement Plan, Medium Term Procurement Plan and other similar documents.'],
                    'The institution monitors the program implementation that is stipulated in the Strategic Action Plan.' => [],
                    'The administrative officials are appointed in accordance with the Civil Service Commission (CSC) Qualification Standards and other pertinent memorandum circulars.' => [],
                    'The Board performs its duties and functions as stipulated in the University/College Charter or Code.' => [],
                ],
                'outcome' => [
                    'The VMGO is clearly practiced by all members of the institution.' => [],
                    'Strategic Plans / Action Plan are cascaded up to the lowest member of the institution.' => [],
                    'Professional, qualified and competent top management officials are employed by the institution.' => [],
                    'Sound and clear policies are in place to guide the institution in carrying out its operations and programs.' => [],
                ]
            ],
            'Academic Administration' => [
                'input' => [
                    'Academic Administration Officials include the following:' => ['Deans', 'Assistant Deans or Assistant College Heads and where appropriate,', 'College Secretary', 'Area Coordinators or Area Chairs,', 'Department Head'],
                    'The following Academic Officials have the academic qualifications as prescribed by the appropriate CHED and CMO 40 , s. 2008 for the program accredited:' => ['Deans/College Heads', 'Assistant Deans', 'Area Coordinators/Area Chairs', 'Dean of Student Affairs'],
                    'There is a Faculty Federation/Faculty Club supportive of the institutional goals and objectives to promote quality education.' => [],
                    'There is a mechanism for' => ['regular and periodic performance evaluation of faculty and other academic personnel.', 'rewards, awards and incentives for service excellence.', 'faculty development and training'],
                ],
                'process' => [
                    'The Institution periodically reviews and enhances its organizational structure, qualification standards, performance evaluation metrics, training programs and other institutional processes as mandated by law and as duly approved by the Board of Regent/ Board of Trustees' => [],
                    'The Institution regularly conducts the following:' => ['performance evaluation of faculty and other academic personnel;', 'granting of rewards, awards and incentives for service excellence; and', 'faculty development and training.'],
                ],
                'outcome' => [
                    'There is university-wide awareness of the organizational structure, qualification standards, performance evaluation metrics, training programs and other institutional processes.' => [],
                    'The systems are fully implemented.' => [],
                    'Professional, qualified, competent faculty members and academic officials/employees are recruited/ developed/ retained.' => [],
                    'Improved faculty performance as evidenced by the performance evaluation and increasing number of awardees.' => [],
                    'Implemented Faculty Development Program' => [],
                ]
            ],
            'Administration of Non-Academic Personnel' => [
                'input' => [
                    'There are clearly defined hiring procedures for non-academic personnel as shown in their Hiring Procedure and in the creation of Personnel Selection Board (PSB) or its equivalent.' => [],
                    'There is an Orientation Program provided to new Non-Academic personnel.' => [],
                    'Duties of each employee are clearly defined.' => [],
                    'The terms of employment are defined according to law as shown in the copy of the Contract of Non-Academic Personnel/Job Order' => [],
                    'There is a development program for non-academic personnel.' => [],
                    'There is a performance evaluation of non-academic personnel.' => [],
                    'There is a Ranking System for administrative personnel as evident in the following documents:' => ['Copy of Procedure for Promotion of Non-Academic Personnel;', 'CSC- Qualification Standards;', 'MC 19 s.2005 and other pertinent CHED and CSC provision related to promotion; and', 'List of employees promoted.'],
                    'There is a committee for handling complaints, dialogue and grievance.' => [],
                    'There are different types of CSC approved leaves and entitlements for all categories of personnel.' => [],
                ],
                'process' => [
                    'The Institution, through its designated unit, conducts the following key processes:' => ['Collection and remittance', 'Banking', 'Supplies Management', 'Budget preparation and review', 'Bookkeeping – General Funds', 'Liquidation and reconciliation', 'Procurement process', 'Monitoring of inventory', 'Others'],
                ],
                'outcome' => [
                    'Efficient Fund Management' => [],
                    'Collection Efficiency' => [],
                    'Successful implementation of projects and programs as stipulated under Annual Investment Plan, APP and PPMP' => [],
                    'Audited accounting records and financial statements' => [],
                    'Functional supply management system.' => [],
                ]
            ],
            'Financial Management' => [
                'input' => [
                    'The following offices that supervises business activities and financial transactions of the institution are in placed:' => ['Finance Office', 'Budget Office', 'Accounting Office'],
                    'Each of the above office has the following:' => ['specific and clearly defined functions of the office;', 'professionally qualified head;', 'adequate plantilla positions for staff; and', 'clearly defined functions, duties and responsibilities of the head and staff.'],
                    'The Finance Office:' => ['has personnel who are responsible for collections and remittance to the Local Government Unit;', 'has personnel who are responsible for banking and other related functions;', 'has officials who are responsible for the custody of the collections and the records;', 'has officials who are responsible for advances and drawdowns of the appropriations;', 'has personnel who look after requests and acquisitions of supplies from the LGU;', 'has officials who are responsible for preparing reports and submitting of reports;', 'has a service procedure for all types of student transactions such as: tuition, miscellaneous and other fees and charges, refunds, clearances and evaluations for exams and graduation.'],
                    'The Budget Office:' => ['Has a team that is responsible for the preparation of formal annual budget of the institution.', 'Has officials who are responsible for the implementation of the institution’s expenditure plan.'],
                    'In the Accounting Office:' => ['There is an existing functional system of bookkeeping.', 'There is a liquidation/reconciliation system.', 'There are officials responsible for complying with auditing requirements and controls.', 'There are officials who are responsible for preparing reports and financial statements of the University.'],
                    'The Institution has mechanisms/systems for the following:' => ['mechanism to rectify shortfalls in supplies of materials, equipment, and tools.', 'system of data gathering for budget preparation and consolidation.', 'mechanism for revenue projection for the coming academic year.', 'system for conducting institutional quarterly budget reviews.', 'mechanism for expenditure control of General Funds.', 'mechanism for the expenditure control of the institution trust and other funds.'],
                ],
                'process' => [
                    'The Institution, through its designated unit, conducts the following key processes:' => ['Collection and remittance', 'Banking', 'Supplies Management', 'Budget preparation and review', 'Bookkeeping – General Funds', 'Liquidation and reconciliation'],
                ],
                'outcome' => [
                    'Efficient Fund Management' => [],
                    'Collection Efficiency' => [],
                    'Successful implementation of projects and programs as stipulated under Annual Investment Plan, APP and PPMP' => [],
                    'Audited accounting records and financial statements' => [],
                    'Functional supply management system.' => [],
                    'Functional requisition and purchasing procedures.' => [],
                ]
            ],
            'Supply Management' => [
                'input' => [
                    'The Institution has a Supply and Property Management Officer or its equivalent.' => [],
                    'There are qualified personnel in the office.' => [],
                    'The functions, duties and responsibilities of the office, head and staff are clearly defined.' => [],
                    'There is a periodic inventory of supplies and equipment.' => [],
                    'There is a distribution system of supplies and equipment.' => [],
                    'There are Memorandum Receipts for supplies and Acknowledgement Receipt of Equipment.' => [],
                    'There are Inventory Records.' => [],
                ],
                'process' => [
                    'The institution follows a process/procedure that functionally allocates, procures, distributes and maintains supplies with proper documentation.' => [],
                    'The institution implements a periodic physical inventory of supplies and other assets.' => [],
                ],
                'outcome' => [
                    'Optimized resource (equipment and supplies) utilization' => [],
                    'Safeguarded assets' => [],
                    'Organized distribution of supplies' => [],
                    'Updated files of supply' => [],
                    'Physical inventory' => [],
                    'Reliable inventory of supplies' => [],
                ]
            ],
            'Records Management' => [
                'input' => [
                    'The institution has a Records Management Office with the following:' => ['qualified Records Management Officer or its equivalent;', 'adequate qualified personnel;', 'clearly defined functions, duties and responsibilities of the office, head and staff;and', 'computers for records management.'],
                ],
                'process' => [
                    'The Institution implements a record management system that ensures data integrity/data privacy, and which can be referenced either manually and/or with the aid of automation.' => [],
                    'The institution conducts special training for records management.' => [],
                    'The Records Office maintains the following:' => ['Minutes of Board of Regents Meeting(BOR)/Board of Trustees(BOT):University/College Secretary Office or its equivalent', 'Minutes of Academic Council Meeting: Vice President for Academic Affairs or its equivalent', 'Minutes of Departmental Meeting: College/Department or its equivalent', 'Faculty Directory: Human Resource Management Office or its equivalent', 'Records of Faculty Qualifications: Human Resource Management', 'Summary of Enrolment by Class, Gender and Course: Registrar’s Office', 'Student Listings: Registrar’s Office, Information Technology Center, College/Department concerned', 'Student Statistical Data: Registrar’s Office, Information Technology Center, College/Department concerned', 'Records of Psychological Tests Administered: Human Resource Management Office', 'Research Outputs of Faculty: University/College Library/Research Office, College/Department concerned', 'Research Outputs of Students: University/College Library, Records Office, College/Department concerned'],
                ],
                'outcome' => [
                    'Organized usage and archival of raw data and computerized data that supports critical operation of the institution' => [],
                    'Fast and efficient retrieval of data/documents' => [],
                ]
            ],
            'Institutional Planning and Development' => [
                'input' => [
                    'The institution has a Planning and Development Office.' => [],
                    'The institution has a Planning and Development Officer or its equivalent.' => [],
                    'There are qualified personnel in the office.' => [],
                    'The functions, duties and responsibilities of the office, head and staff are clearly defined.' => [],
                    'The institutional plans are directed towards realization of its VMGO addressing the city/local development plan, regional and national development plan, the Millennium Development Goals and the ASEAN Integration 2015 Goals.' => [],
                ],
                'process' => [
                    'The institution regularly conducts a planning exercise that aims to review the VMGO and institutional strategies' => [],
                    'The Planning and Development office maintains the following:' => ['Strategic Plan', 'Tactical Plan', 'Operational Plan'],
                    'The Institution formulates mechanisms for periodic review of plans' => [],
                    'The planning and development office periodically monitors the implementation and development of the plans and programs.' => [],
                ],
                'outcome' => [
                    'The strategic plans are cascaded down to the lowest level of employee' => [],
                    'Institutional strategies are successfully implemented.' => [],
                ]
            ],
            'Linkages and Networking' => [
                'input' => [
                    'The institution has a Linkages and Networking Office.' => [],
                    'The institution has a Linkages and Networking Officer or its equivalent.' => [],
                    'There are qualified personnel in the office.' => [],
                    'The functions, duties and responsibilities of the office, head and staff are clearly defined.' => [],
                    'The office has a copy of the list of linkages and networking.' => [],
                    'The office has a copy of Memorandum of Agreement (MOA)/ Memorandum of Understanding (MOU).' => [],
                ],
                'process' => [
                    'The Office in-charge of linkages and networking performs a review, tracking and evaluation of MOA/MOU of all its Industry-Partners.' => [],
                ],
                'outcome' => [
                    'Responsive and collaborative program/undertaking that meets the requirements of:' => ['internal/external stakeholders', 'the institution and its industry partners'],
                ]
            ]
        ];
    }

    private function area2Data(): array
    {
        return [
            'Academic Qualifications and Teaching Experiences' => [
                'input' => [
                    'Faculty members teaching general education courses are master’s degree graduates.' => [],
                    'Faculty members who teach major courses possess appropriate graduate/post graduate degree qualifications.' => [],
                    'Faculty members possess extensive teaching experience and/or industry practice in their fields of specialization.' => [],
                    'Faculty members are affiliated with professional organizations in their fields of specialization.' => [],
                ],
                'process' => [
                    'Regular updating, monitoring and evaluation of faculty qualifications' => [],
                    'Provision for Faculty Development Program: Scholarships, Trainings, Workshops, and Grants' => [],
                ],
                'outcome' => [
                    'Faculty members demonstrate mastery of the subject matter and effective delivery of the learning competencies in their own field of expertise;' => [],
                    'Faculty members are members or leaders of recognized professional organizations here and abroad.' => [],
                    'The institution is able to comply with CHED’s requirements, ASEAN requirements, and other international standards on faculty qualifications' => [],
                ]
            ],
            'Recruitment and Selection' => [
                'input' => [
                    'There are institutional policies on faculty selection as evidenced by the following documents:' => ['Qualification Standards', 'Ranking and Promotion Plan', 'Ranking instrument', 'Personnel Selection Board', 'Published Administrative Code, University/College Code/ Manual of Regulations/ Faculty Manual, Flow Chart of HRMO'],
                    'The faculty selection board is composed of:' => ['School Head or representative', 'Academic Head or representative', 'HR Officer', 'Faculty Representative', 'Dean or its equivalent'],
                ],
                'process' => [
                    'The minimum requirements of the Civil Service Commission and the University criteria/standards are taken into consideration in the recruitment, selection and hiring of faculty members.' => [],
                    'The faculty selection process gives due consideration on the following:' => ['Academic qualification ( Education)', 'Professional Licensure/Eligibility', 'Teaching Experience', 'Trainings and Seminars', 'Professional Experience', 'Teaching Competencies', 'Oral and written communication', 'Research capability', 'Community Extension Activities', 'Technical competencies, if applicable', 'Character', 'Personality', 'Health'],
                    'The Local Chief Executive appoints all employees of the institution.' => [],
                    'The institution observes the criteria for recruitment, selection, and hiring' => [],
                    'The institution implements employment policies.' => [],
                ],
                'outcome' => [
                    'Presence of highly qualified applicants' => [],
                    'Presence of functional faculty researchers' => [],
                    'Competent faculty members were employed' => [],
                    'Existence of Selection and Recruitment Policy' => [],
                ]
            ],
            'Ranking and Promotion' => [
                'input' => [
                    'There is a faculty ranking and promotion system used by the institution.' => [],
                    'There is a career pathing and succession plan for the faculty' => [],
                    'The length of the probationary period is in accordance to Civil Service Commission standards' => [],
                    'There are procedures for the termination of employment. As indicated in the Administrative Code, Faculty Manual and other supporting details' => [],
                    'There are procedures for the dismissal of faculty including due process.' => [],
                ],
                'process' => [
                    'Institutionalization of the following:' => ['Merit, Ranking and Promotion Plan', 'Career Pathing Plan', 'Succession Plan'],
                ],
                'outcome' => [
                    'List of promoted and regularized faculty members' => [],
                    'Due process observed' => [],
                    'Low rate of faculty turnover' => [],
                    'Career Pathing and Succession Plan' => [],
                ]
            ],
            'Faculty Loading' => [
                'input' => [
                    'The institution has clear policies on faculty loading that complies with the minimum requirements of the Commission on Higher Education in terms of the following:' => ['Academic Qualifications', 'Field of Specialization', 'Number of Preparations', 'Number of Units of Teaching Loads; and', 'Administrative Support'],
                    'The institutional system on faculty loading contains specific provisions for faculty with additional responsibilities which includes the following:' => ['Rewards', 'Service credits', 'Honorarium', 'Points for promotions', 'Ranking, recognitions'],
                ],
                'process' => [
                    'Ratio of full time to part time faculty is 7 is to 3 as shown in the Summary of teaching assignment duly signed by the designated authority.' => [],
                    'The faculty members teach their major and minor fields of specialization.' => [],
                    'Full-time faculty teaching load per week is in accordance with acceptable standards.' => [],
                    'Faculty with concurrent or special designations are given the following rewards and incentives:' => ['Equivalent teaching units', 'Service credits', 'Honorarium', 'Points for promotion, Ranking or recognitions'],
                    'Some faculty members are given special assignments such as:' => ['Program/Project Coordinator/Member', 'Chairmanship', 'Student Organization Advisorship', 'Other special tasks'],
                ],
                'outcome' => [
                    'Faculty load complies with CHED requirements.' => [],
                ]
            ],
            'Professional Performance and Scholarly Work' => [
                'input' => [
                    'The institution has clear policies and programs on research that promotes research capability and engagements.' => [],
                    'The institution has specific budget for research such as:' => ['Incentives for research engagements;', 'Support for research presentation; and', 'Support for research publications.'],
                ],
                'process' => [
                    'The institution provides support for research and publication through allocation of a budget for the following:' => ['Honorarium;', 'Deloading;', 'Service credits; and', 'Seminars and trainings on research.'],
                    'There are faculty members who published books or instructional material/s.' => [],
                ],
                'outcome' => [
                    'Research Journal publication' => [],
                    'There are faculty members who published books or instructional material/s.' => [],
                ]
            ],
            'Performance Evaluation' => [
                'input' => [
                    'The institution has a system that:' => ['Monitors submission of academic requirements such as syllabi, grades and the like', 'Monitors faculty participation in trainings, meetings and other institutional activities/ services'],
                    'There is provision for faculty evaluation by the students, peers, self and immediate superiors' => [],
                    'There are professional involvement and training of faculty as evidenced by the following:' => ['Affiliation to professional organizations;', 'Conduct of seminars and trainings;', 'Participation in civic organizations; and', 'Participation as Presenter/ Lecturer/ Facilitator/ Panelist/ Evaluator.'],
                ],
                'process' => [
                    'The institution regularly conducts performance evaluation of faculty members using standardized instrument duly understood by the faculty that includes teaching competencies, research and community involvement' => [],
                ],
                'outcome' => [
                    'Attitudes and values of the faculty members are demonstrated in the following:' => ['Strict adherence to policies, rules and regulations and protocol;', 'Punctuality;', 'Courtesy;', 'Participation to school activities/ meetings; and', 'Initiative in organizing programs and projects.'],
                    'Compliance with administrative requirements are evident in the following submissions:' => ['Submission of syllabi;', 'Table of specifications;', 'Test questions with answer key;', 'Monthly attendance of students before the specified date of submission; and', 'Grades and other academic reports.'],
                ]
            ],
            'Faculty Development Program' => [
                'input' => [
                    'The institution has Faculty Development Program as shown by the following:' => ['budget;', 'trainings and seminars;', 'financial assistance;', 'honorarium;', 'scholarships;', 'service credits;', 'leave credits; and', 'career advancement/ promotion.'],
                    'There is an orientation/ reorientation program for all faculty which includes the institution’s mission statements and its philosophy, institutional strategies and policies.' => [],
                ],
                'process' => [
                    'The institution proposes a budget for Faculty Development Program' => [],
                    'The institution solicits the approval of the Faculty Development Program' => [],
                    'The institution monitors the faculty meeting and attendance of faculty in meetings, seminars and other training program.' => [],
                ],
                'outcome' => [
                    'The budget for Faculty Development Programs was implemented.' => [],
                    'Meetings regularly held' => [],
                    'In service training regularly conducted' => [],
                    'Faculty Scholarships' => [],
                ]
            ],
            'Faculty Relationships' => [
                'input' => [
                    'There is a faculty association that provides for the personal and professional growth of its members, and promotes faculty welfare through the following activities/programs:' => ['sports and wellness activities', 'scholarship', 'sponsorship', 'financial rewards for exemplary/commendable performances', 'financial aid in case of wedding, retirement, sickness, disability, death', 'team building activity', 'spiritual activity', 'special day celebration ( Family day, Teachers day)'],
                ],
                'process' => [
                    'The institution supports Faculty Association programs and activities' => [],
                    'The institution provides opportunities for faculty to have harmonious relationship with the administration, students and other stakeholders.' => [],
                ],
                'outcome' => [
                    'Faculty Association activities and programs are conducted' => [],
                    'Faculty activities and program with the administration/ students/ other stakeholders are conducted.' => [],
                ]
            ],
            'Salaries and Benefits' => [
                'input' => [
                    'Faculty members receive their salaries regularly.' => [],
                    'There is an existence of policy on salary and other fringe benefits duly approved by the BOR and is consistent with the Department of Budget and Civil Service Rules related to the following:' => ['Vacation pay;', 'Salary adjustment/increment;', 'Honorarium;', 'Productivity incentive allowance;', 'Overtime pay; and', 'Clothing allowance/ other related allowances.'],
                ],
                'process' => [
                    'The institution set up a system for leave administration like ledger and leave form.' => [],
                    'The institution audits leave credit.' => [],
                    'The institution facilitates mandatory and fringe benefits within the prescribed period.' => [],
                    'The institution facilitates the payroll on time.' => [],
                ],
                'outcome' => [
                    'Facilitated payroll, mandatory benefit and different fringe benefit on time.' => [],
                    'System of leave administration is formulated and implemented.' => [],
                    'Conducted regular audit of leave credits.' => [],
                ]
            ]
        ];
    }
}
