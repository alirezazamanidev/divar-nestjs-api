const exampleFormFilds = [
    // فیلدهای فرم برای خانه ویلایی
    [
        {
            "name": 'area',
            "type": 'number',
            "label": 'متراژ زمین',
            "required": true,
            "validation": {
                "min": 100,
                "max": 10000
            }
        },
        {
            "name": 'buildingArea', 
            "type": 'number',
            "label": 'متراژ بنا',
            "required": true,
            "validation": {
                "min": 50,
                "max": 1000
            }
        },
        {
            "name": 'rooms',
            "type": 'number', 
            "label": 'تعداد اتاق',
            "required": true,
            "validation": {
                "min": 1,
                "max": 10
            }
        },
        {
            "name": 'hasPool',
            "type": 'checkbox',
            "label": 'استخر دارد',
            "required": false
        },
        {
            "name": 'hasGarden',
            "type": 'checkbox', 
            "label": 'باغچه دارد',
            "required": false
        },
        {
            "name": 'buildingAge',
            "type": 'number',
            "label": 'سن بنا',
            "required": true,
            "validation": {
                "min": 0,
                "max": 100
            }
        }
    ],

    // فیلدهای فرم برای خانه آپارتمانی 
    [
        {
            "name": 'area',
            "type": 'number',
            "label": 'متراژ',
            "required": true,
            "validation": {
                "min": 30,
                "max": 500
            }
        },
        {
            "name": 'floor',
            "type": 'number',
            "label": 'طبقه',
            "required": true,
            "validation": {
                "min": -2,
                "max": 100
            }
        },
        {
            "name": 'totalFloors',
            "type": 'number',
            "label": 'تعداد کل طبقات',
            "required": true,
            "validation": {
                "min": 1,
                "max": 100
            }
        },
        {
            "name": 'rooms',
            "type": 'number',
            "label": 'تعداد اتاق',
            "required": true,
            "validation": {
                "min": 0,
                "max": 5
            }
        },
        {
            "name": 'parking',
            "type": 'checkbox',
            "label": 'پارکینگ دارد',
            "required": false
        },
        {
            "name": 'elevator',
            "type": 'checkbox',
            "label": 'آسانسور دارد', 
            "required": false
        },
        {
            "name": 'storage',
            "type": 'checkbox',
            "label": 'انباری دارد',
            "required": false
        },
        {
            "name": 'buildingAge',
            "type": 'number',
            "label": 'سن ساختمان',
            "required": true,
            "validation": {
                "min": 0,
                "max": 100
            }
        }
    ]
];