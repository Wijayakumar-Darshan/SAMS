package com.SAMS.demo.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.SAMS.demo.entity.School;

public interface SchoolRepository extends JpaRepository<School, Long> { }