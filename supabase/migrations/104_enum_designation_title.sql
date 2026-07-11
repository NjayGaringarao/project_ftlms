do $$
begin
  create type public.designation_title_enum as enum (
    'Director for Instruction',
    'College Dean',
    'Campus Director',
    'Program Chairperson',
    'Assistant Director-Graduate Studies',
    'Extension Program',
    'Research',
    'CAA Coordinator',
    'Campus Climate Change Coordinator',
    'Campus Computer Laboratory in Charge',
    'Campus Cultural and Arts Affairs Coordinator',
    'Campus Document Control Officer',
    'Campus Extension Coordinator',
    'Campus Faculty President',
    'Campus NSTP Coordinator',
    'Campus Gender and Development Coordinator',
    'Campus Guidance Counselor',
    'Campus HRMO Coordinator',
    'Campus International Linkages Coordinator',
    'College Research Coordinator',
    'Campus Nurse',
    'Campus School Publication Coordinator',
    'Campus Student Affairs Coordinator',
    'Campus SSG Adviser',
    'Campus Student Conduct Coordinator',
    'Campus Discipline Coordinator',
    'Campus Sports Coordinator',
    'Campus Student Organization Coordinator',
    'Campus CADO Coordinator',
    'Campus CCI Coordinator',
    'Campus IGP Coordinator',
    'Quality Assurance',
    'Head',
    'Network Administrator',
    'Programmer',
    'Secretary',
    'Vice President for Academic Affairs',
    'Website Administrator'
  );
exception
  when duplicate_object then
    null;
end
$$;
