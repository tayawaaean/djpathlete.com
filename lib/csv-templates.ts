export const EXERCISE_TEMPLATE_CSV = `name,description,category,difficulty,muscle_group,equipment,instructions,is_bodyweight,is_compound,video_url
Barbell Back Squat,Compound lower body movement targeting quads and glutes,strength,intermediate,Quadriceps / Glutes,Barbell / Squat Rack,"1. Set bar on upper traps. 2. Unrack and step back. 3. Brace core, squat to parallel. 4. Drive through heels to stand.",false,true,
Romanian Deadlift,Hip hinge targeting posterior chain,strength,intermediate,Hamstrings / Glutes,Barbell,"1. Hold barbell at hip height. 2. Push hips back, lowering bar along shins. 3. Feel stretch in hamstrings. 4. Drive hips forward to stand.",false,true,
Dumbbell Bench Press,Horizontal pressing movement for chest development,strength,beginner,Chest / Triceps,Dumbbells / Bench,"1. Lie on bench holding dumbbells above chest. 2. Lower to chest level. 3. Press up to full extension.",false,true,
Pull-Up,Vertical pulling bodyweight exercise,strength,intermediate,Lats / Biceps,Pull-up Bar,"1. Hang from bar with overhand grip. 2. Pull chin above bar. 3. Lower with control.",true,true,
Bulgarian Split Squat,Single-leg squat variation for unilateral strength,strength,intermediate,Quadriceps / Glutes,Dumbbells / Bench,"1. Rear foot elevated on bench. 2. Lower until front thigh is parallel. 3. Drive through front heel to stand.",false,true,`

export const EXERCISE_RELATIONSHIPS_TEMPLATE_CSV = `exercise_name,related_exercise_name,relationship_type,notes
Barbell Back Squat,Goblet Squat,regression,Simpler squat pattern for beginners learning mechanics
Barbell Back Squat,Front Squat,variation,Shifts emphasis to quads and upper back
Barbell Back Squat,Bulgarian Split Squat,alternative,Unilateral option when barbell squatting is contraindicated
Goblet Squat,Barbell Back Squat,progression,Progress to barbell once goblet form is solid
Romanian Deadlift,Single-Leg Romanian Deadlift,progression,Unilateral progression for balance and stability
Romanian Deadlift,Good Morning,variation,Similar hinge pattern with bar on back
Dumbbell Bench Press,Push-Up,regression,Bodyweight alternative for beginners
Dumbbell Bench Press,Barbell Bench Press,progression,Higher loading potential with barbell
Pull-Up,Lat Pulldown,regression,Machine alternative when pull-ups are too difficult
Pull-Up,Chin-Up,variation,Supinated grip shifts emphasis to biceps
Plank,Dead Bug,regression,Supine anti-extension for beginners
Plank,Ab Wheel Rollout,progression,Dynamic anti-extension with greater demand`
