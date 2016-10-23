define([], function() {
	return {
		complexDataArray : [
			{
				id : 1,
				name : "name1",
				date : "2012-01-01",
				amount : 12.27 + 13.67 + 23.32,
				groupId : 1,
				address : {
					zip : "12345",
					city : "Bratislava"
				},
				documents : [
					{
						code : "DOC0001",
						date : "2012-01-03",
						amount : 12.27
					},
					{
						code : "DOC0005",
						date : "2012-01-09",
						amount : 13.67
					},
					{
						code : "DOC0006",
						date : "2012-01-20",
						amount : 23.32
					}
				]
			},
			{
				id : 2,
				name : "name1",
				date : "2012-02-01",
				amount : 0,
				groupId : 1,
				address : {
					zip : "54321",
					city : "Bratislava"
				}
			},
			{
				id : 3,
				name : "name1",
				date : "2012-02-01",
				groupId : 1,
				address : {
					zip : "54321",
					city : "Bratislava"
				},
				documents : [
					{
						code : "DOC0002",
						date : "2012-01-20",
						amount : 123.32
					},
					{
						code : "DOC0003",
						date : "2012-01-21",
						amount : 196.25
					},
					{
						code : "DOC0004",
						date : "2012-01-22",
						amount : 982.31
					}
				]
			},
			{
				id : 4,
				name : "name2",
				date : "2012-01-01",
				groupId : 2,
				address : {
					zip : "12345",
					city : "Bratislava"
				}
			},
			{
				id : 5,
				name : "name2",
				date : "2012-02-01",
				amount : 0,
				groupId : 2,
				address : {
					zip : "54321",
					city : "Bratislava"
				}
			}
		],

		complexDataObject : {
			id : 1,
			name : "name1",
			date : "2012-01-01",
			amount : 12.27 + 13.67 + 23.32,
			groupId : 1,
			address : {
				zip : "12345",
				city : "Bratislava"
			},
			documents : [
				{
					code : "DOC0001",
					date : "2012-01-03",
					amount : 12.27,
					address : {
						zip : "12345",
						city : "Bratislava"
					}
				},
				{
					code : "DOC0005",
					date : "2012-01-09",
					amount : 13.67,
					address : {
						zip : "12345",
						city : "Levice"
					}
				},
				{
					code : "DOC0006",
					date : "2012-01-20",
					amount : 23.32,
					address : {
						zip : "54321",
						city : "Bratislava"
					}
				}
			]
		}
	};
});