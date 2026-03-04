"use server";

import {
  getFacultyList as _getFacultyList,
  getProgramChairBootstrapData as _getProgramChairBootstrapData,
  getRoomsByCampus as _getRoomsByCampus,
} from "./actions/read-bootstrap";
import {
  getOfferedCourseOptionsByTermCampuses as _getOfferedCourseOptionsByTermCampuses,
  getOfferedCoursesByTermCampus as _getOfferedCoursesByTermCampus,
} from "./actions/read-offerings";
import {
  findOrCreateSchedule as _findOrCreateSchedule,
  getFacultyScheduleBundle as _getFacultyScheduleBundle,
} from "./actions/read-schedule";
import {
  createClass as _createClass,
  deleteClass as _deleteClass,
  deleteClassesByCourseOffering as _deleteClassesByCourseOffering,
  mergeClassDeliveries as _mergeClassDeliveries,
  pruneScheduleByCampuses as _pruneScheduleByCampuses,
  unmergeClassBlock as _unmergeClassBlock,
  updateClass as _updateClass,
} from "./actions/mutate-classes";
import {
  deleteSession as _deleteSession,
  saveSession as _saveSession,
} from "./actions/mutate-sessions";
import {
  submitScheduleForCampusDirector as _submitScheduleForCampusDirector,
  submitScheduleForCampusDirectors as _submitScheduleForCampusDirectors,
} from "./actions/mutate-submission";

export const getFacultyList = async (
  ...args: Parameters<typeof _getFacultyList>
): ReturnType<typeof _getFacultyList> => _getFacultyList(...args);

export const getProgramChairBootstrapData = async (
  ...args: Parameters<typeof _getProgramChairBootstrapData>
): ReturnType<typeof _getProgramChairBootstrapData> =>
  _getProgramChairBootstrapData(...args);

export const getRoomsByCampus = async (
  ...args: Parameters<typeof _getRoomsByCampus>
): ReturnType<typeof _getRoomsByCampus> => _getRoomsByCampus(...args);

export const getOfferedCourseOptionsByTermCampuses = async (
  ...args: Parameters<typeof _getOfferedCourseOptionsByTermCampuses>
): ReturnType<typeof _getOfferedCourseOptionsByTermCampuses> =>
  _getOfferedCourseOptionsByTermCampuses(...args);

export const getOfferedCoursesByTermCampus = async (
  ...args: Parameters<typeof _getOfferedCoursesByTermCampus>
): ReturnType<typeof _getOfferedCoursesByTermCampus> =>
  _getOfferedCoursesByTermCampus(...args);

export const findOrCreateSchedule = async (
  ...args: Parameters<typeof _findOrCreateSchedule>
): ReturnType<typeof _findOrCreateSchedule> => _findOrCreateSchedule(...args);

export const getFacultyScheduleBundle = async (
  ...args: Parameters<typeof _getFacultyScheduleBundle>
): ReturnType<typeof _getFacultyScheduleBundle> =>
  _getFacultyScheduleBundle(...args);

export const createClass = async (
  ...args: Parameters<typeof _createClass>
): ReturnType<typeof _createClass> => _createClass(...args);

export const deleteClass = async (
  ...args: Parameters<typeof _deleteClass>
): ReturnType<typeof _deleteClass> => _deleteClass(...args);

export const deleteClassesByCourseOffering = async (
  ...args: Parameters<typeof _deleteClassesByCourseOffering>
): ReturnType<typeof _deleteClassesByCourseOffering> =>
  _deleteClassesByCourseOffering(...args);

export const mergeClassDeliveries = async (
  ...args: Parameters<typeof _mergeClassDeliveries>
): ReturnType<typeof _mergeClassDeliveries> => _mergeClassDeliveries(...args);

export const pruneScheduleByCampuses = async (
  ...args: Parameters<typeof _pruneScheduleByCampuses>
): ReturnType<typeof _pruneScheduleByCampuses> =>
  _pruneScheduleByCampuses(...args);

export const unmergeClassBlock = async (
  ...args: Parameters<typeof _unmergeClassBlock>
): ReturnType<typeof _unmergeClassBlock> => _unmergeClassBlock(...args);

export const updateClass = async (
  ...args: Parameters<typeof _updateClass>
): ReturnType<typeof _updateClass> => _updateClass(...args);

export const deleteSession = async (
  ...args: Parameters<typeof _deleteSession>
): ReturnType<typeof _deleteSession> => _deleteSession(...args);

export const saveSession = async (
  ...args: Parameters<typeof _saveSession>
): ReturnType<typeof _saveSession> => _saveSession(...args);

export const submitScheduleForCampusDirector = async (
  ...args: Parameters<typeof _submitScheduleForCampusDirector>
): ReturnType<typeof _submitScheduleForCampusDirector> =>
  _submitScheduleForCampusDirector(...args);

export const submitScheduleForCampusDirectors = async (
  ...args: Parameters<typeof _submitScheduleForCampusDirectors>
): ReturnType<typeof _submitScheduleForCampusDirectors> =>
  _submitScheduleForCampusDirectors(...args);
