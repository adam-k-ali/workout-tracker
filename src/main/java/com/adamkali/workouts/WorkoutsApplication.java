package com.adamkali.workouts;

import com.adamkali.workouts.database.entities.ExerciseType;
import com.adamkali.workouts.database.repository.ExercisesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

@SpringBootApplication
public class WorkoutsApplication {
	private static final Logger LOGGER = LoggerFactory.getLogger(WorkoutsApplication.class);

	public static void main(String[] args) {
		SpringApplication.run(WorkoutsApplication.class, args);
	}

	@Bean
	public CommandLineRunner demo(ExercisesRepository repository) {
		return (args) -> {
			LOGGER.info("Exercises found with findAll():");
			LOGGER.info("-------------------------------");
			for (ExerciseType exercise : repository.findAll()) {
				LOGGER.info(exercise.toString());
			}
			LOGGER.info("");

		};
	}

}
