package com.adamkali.workouts.database.repository;

import com.adamkali.workouts.database.entities.ExerciseType;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

public interface ExercisesRepository extends CrudRepository<ExerciseType, Integer> {
}
