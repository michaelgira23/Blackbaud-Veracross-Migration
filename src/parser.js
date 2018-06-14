const fs = require('fs-extra');
const csvParse = require('csv-parse');
const moment = require('moment');

const weekdays = [
	'Sunday',
	'Monday',
	'Tuesday',
	'Wednesday',
	'Thursday',
	'Friday',
	'Saturday'
];

/**
 * Parse CSV and calculate what to add for resource reservations
 * @param {object} reservations - What to enter in the system
 * @param {object} table - Raw CSV file parsed to JSON
 */

function parse(filePath, callback) {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) throw err;

		csvParse(data, (err, raw) => {
			if (err) {
				return callback(err, null, null);
			}
			const table = formatTable(raw);

			// Group by event name
			const rowsByEvent = group(table, current => current.description);

			// Group by room number
			const groupRooms = {};
			for (const event of Object.keys(rowsByEvent)) {
				groupRooms[event] = group(rowsByEvent[event], current => current.room);
			}

			// Group by start/end time
			const groupTimes = {};
			for (const event of Object.keys(groupRooms)) {
				groupTimes[event] = {};
				for (const room of Object.keys(groupRooms[event])) {
					groupTimes[event][room] = group(groupRooms[event][room], current => {
						return `${momentToTime(current.start)}-${momentToTime(current.end)}`;
					});
				}
			}

			// Group dates together
			const reservations = {};
			for (const event of Object.keys(groupTimes)) {
				reservations[event] = {};
				for (const room of Object.keys(groupTimes[event])) {
					for (const time of Object.keys(groupTimes[event][room])) {
						if (typeof reservations[event][room] !== 'object') {
							reservations[event][room] = {};
						}
						if (typeof reservations[event][room].custom !== 'object') {
							reservations[event][room].custom = [];
						}
						if (typeof reservations[event][room].regular !== 'object') {
							reservations[event][room].regular = [];
						}

						// Filter out events that take place over multiple days
						const rows = groupTimes[event][room][time];
						for (let i = 0; i < rows.length; i++) {
							const row = rows[i];
							if (!row.start.clone().startOf('day').isSame(row.end.clone().startOf('day'))) {
								reservations[event][room].custom.push({
									description: row.description,
									room: row.room,
									from: momentToDate(row.start),
									to: momentToDate(row.end),
									startTime: momentToTime(row.start),
									endTime: momentToTime(row.end),
								});
								rows.splice(i--, 1);
							}
						}

						reservations[event][room].regular = reservations[event][room].regular.concat(simplify(rows));
						reservations[event][room].regular.sort((a, b) => {
							return moment(a.from).valueOf() - moment(b.from).valueOf();
						});
						reservations[event][room].custom.sort((a, b) => {
							return moment(a.from).valueOf() - moment(b.from).valueOf();
						});
					}
				}
			}
			callback(null, reservations, table);
		});
	});
}

/**
 * Parse CSV and calculate what to add for resource reservations
 * @param {object} reservations - What to enter in the system
 * @param {object} table - Raw CSV file parsed to JSON
 */

function consecutiveParse(filePath, callback) {
	fs.readFile(filePath, 'utf8', (err, data) => {
		if (err) throw err;

		csvParse(data, (err, raw) => {
			if (err) {
				return callback(err, null, null);
			}
			const table = formatTable(raw);

			// Group by event name
			const rowsByEvent = group(table, current => current.description);

			// Group by room number
			const groupRooms = {};
			for (const event of Object.keys(rowsByEvent)) {
				groupRooms[event] = group(rowsByEvent[event], current => current.room);
			}

			// Group by start/end time
			const groupTimes = {};
			for (const event of Object.keys(groupRooms)) {
				groupTimes[event] = {};
				for (const room of Object.keys(groupRooms[event])) {
					groupTimes[event][room] = group(groupRooms[event][room], current => {
						return `${momentToTime(current.start)}-${momentToTime(current.end)}`;
					});
				}
			}

			// Group dates together
			const reservations = {};
			for (const event of Object.keys(groupTimes)) {
				reservations[event] = {};
				for (const room of Object.keys(groupTimes[event])) {
					for (const time of Object.keys(groupTimes[event][room])) {
						if (typeof reservations[event][room] !== 'object') {
							reservations[event][room] = {};
						}
						if (typeof reservations[event][room].custom !== 'object') {
							reservations[event][room].custom = [];
						}
						if (typeof reservations[event][room].regular !== 'object') {
							reservations[event][room].regular = [];
						}

						// Filter out events that take place over multiple days
						const rows = groupTimes[event][room][time];
						for (let i = 0; i < rows.length; i++) {
							const row = rows[i];
							if (!row.start.clone().startOf('day').isSame(row.end.clone().startOf('day'))) {
								reservations[event][room].custom.push({
									description: row.description,
									room: row.room,
									from: momentToDate(row.start),
									to: momentToDate(row.end),
									startTime: momentToTime(row.start),
									endTime: momentToTime(row.end),
								});
								rows.splice(i--, 1);
							}
						}

						reservations[event][room].regular = reservations[event][room].regular.concat(consecutiveSimplify(rows));
						reservations[event][room].regular.sort((a, b) => {
							return moment(a.from).valueOf() - moment(b.from).valueOf();
						});
						reservations[event][room].custom.sort((a, b) => {
							return moment(a.from).valueOf() - moment(b.from).valueOf();
						});
					}
				}
			}
			callback(null, reservations, table);
		});
	});
}

/**
 * Row format
 *
 * 0 - Description
 * 1 - start_date
 * 2 - end_date
 * 3 - start_time
 * 4 - end_time
 * 5 - MRM_MeetingRoomName
 * 6 - resource_id
 * 7 - contact_person_id
 */

function formatTable(raw) {
	const table = [];

	for (const row of raw) {
		const parseStart = parseTime(row[3]);
		const parseEnd = parseTime(row[4]);

		table.push({
			description: row[0],
			room: row[5],
			start: moment(row[1]).add(parseStart.hour, 'hours').add(parseStart.minutes, 'minutes'),
			end: moment(row[2]).add(parseEnd.hour, 'hours').add(parseEnd.minutes, 'minutes'),
			resourceId: row[6],
			personId: row[7]
		});
	}

	return table;
}

/**
 * Simplify rows of the same event, room
 */

function simplify(inputRows) {
	// Clone input rows so we don't mess with that
	const rows = inputRows.slice(0);
	rows.sort((a, b) => {
		return a.start.valueOf() - b.start.valueOf();
	});

	const rowsLeft = rows.slice(0);

	function getDate(target) {
		for (const row of rowsLeft) {
			if (row.start.isSame(target)) {
				return row;
			}
		}
		return null;
	}

	function removeDate(target) {
		for (let i = 0; i < rowsLeft.length; i++) {
			const row = rowsLeft[i];
			if (row.start.isSame(target)) {
				rowsLeft.splice(i, 1);
				return;
			}
		}
	}

	/**
	 * Get dates reoccuring by week
	 */

	const reoccurances = [];
	for (const row of rows) {
		const checkDate = row.start.clone();
		const reoccuringRows = [ row ];

		if (!getDate(row.start)) {
			continue;
		}

		while (true) {
			const nextWeek = checkDate.add(7, 'days');
			const nextWeekOccurence = getDate(nextWeek);
			if (nextWeekOccurence) {
				reoccuringRows.push(nextWeekOccurence);
				removeDate(nextWeekOccurence.start);
			} else {
				break;
			}
		}

		reoccurances.push(reoccuringRows);
	}

	/**
	 * Order reoccurances by length
	 */

	const reoccuranceLengths = {};

	for (const reoccurance of reoccurances) {
		if (typeof reoccuranceLengths[reoccurance.length] !== 'object') {
			reoccuranceLengths[reoccurance.length] = [];
		}
		reoccuranceLengths[reoccurance.length].push(reoccurance);
	}

	reoccurances.sort((a, b) => {
		return b.length - a.length;
	});

	/**
	 * Group events that are on the same week
	 */

	const reservations = [];

	for (const length of Object.keys(reoccuranceLengths)) {
		const reoccurances = reoccuranceLengths[length];

		// Group by start of the week
		const weekGroups = group(reoccurances, current => current[0].start.clone().startOf('week'));

		// Get grouped reoccurances range
		for (const startWeek of Object.keys(weekGroups)) {
			const weekReoccurance = weekGroups[startWeek];
			const start = weekReoccurance[0][0].start;
			const end = lastArrayItem(lastArrayItem(weekReoccurance)).end;

			// Find which weekdays to repeat
			const repeatWeekdays = [];

			for (const reoccurance of weekReoccurance) {
				repeatWeekdays.push(weekdays[reoccurance[0].start.day()]);
			}

			reservations.push({
				description: weekReoccurance[0][0].description,
				room: weekReoccurance[0][0].room,
				from: momentToDate(start),
				to: momentToDate(end),
				startTime: momentToTime(start),
				endTime: momentToTime(end),
				repeat: repeatWeekdays
			});
		}
	}
	return reservations;
}

/**
 * Simplify rows of the same event, room
 */

function consecutiveSimplify(inputRows) {
	// Clone input rows so we don't mess with that
	const rows = inputRows.slice(0);
	rows.sort((a, b) => {
		return a.start.valueOf() - b.start.valueOf();
	});

	const rowsLeft = rows.slice(0);

	function getDate(target) {
		for (const row of rowsLeft) {
			if (row.start.isSame(target)) {
				return row;
			}
		}
		return null;
	}

	function removeDate(target) {
		for (let i = 0; i < rowsLeft.length; i++) {
			const row = rowsLeft[i];
			if (row.start.isSame(target)) {
				rowsLeft.splice(i, 1);
				return;
			}
		}
	}

	/**
	 * Get dates reoccuring by week
	 */

	const reoccurances = [];
	const reservations = [];
	for (const row of rows) {
		const checkDate = row.start.clone();
		const reoccuringRows = [ row ];

		if (!getDate(row.start)) {
			continue;
		}

		while (true) {
			const nextDay = checkDate.add(1, 'day');
			const nextDayOccurence = getDate(nextDay);
			if (nextDayOccurence) {
				reoccuringRows.push(nextDayOccurence);
				removeDate(nextDayOccurence.start);
			} else {
				const end = lastArrayItem(reoccuringRows).end;
				reservations.push({
					description: row.description,
					room: row.room,
					from: momentToDate(row.start),
					to: momentToDate(end),
					startTime: momentToTime(row.start),
					endTime: momentToTime(end),
					repeat: []
				});
				break;
			}
		}
	}

	return reservations;
}

function group(arr, keyFunc) {
	return arr.reduce((acc, current) => {
		const key = keyFunc(current);
		if (typeof acc[key] !== 'object') {
			acc[key] = [];
		}
		acc[key].push(current);
		return acc;
	}, {});
}

function canGroup(row) {
	return !row.start.startOf('day').isSame(row.end.startOf('day'));
}

function momentToDate(momentObj) {
	return momentObj.format('MM/DD/YY');
}

function momentToTime(momentObj) {
	return momentObj.format('h:mma');
}

function parseTime(time) {
	const [ hour, minutes ] = time.split(':');
	return { hour, minutes };
}

function lastArrayItem(array) {
	return array[array.length - 1];
}

module.exports.parse = parse;
module.exports.consecutiveParse = consecutiveParse;
