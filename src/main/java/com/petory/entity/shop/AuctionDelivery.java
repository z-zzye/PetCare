package com.petory.entity.shop;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "auction_delivery")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuctionDelivery {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "auction_delivery_id")
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "auction_history_id", nullable = false, unique = true)
    private AuctionHistory auctionHistory;

    @Column(name = "receiver_name")
    private String receiverName;

    @Column(name = "receiver_phone")
    private String receiverPhone;

    @Column(name = "delivery_address")
    private String deliveryAddress;

    @Column(name = "delivery_address_detail")
    private String deliveryAddressDetail;

    @Column(name = "delivery_memo")
    private String deliveryMemo;

    @Column(name = "delivery_name")
    private String deliveryName;

    @Column(name = "delivery_input_at")
    private LocalDateTime deliveryInputAt;

    @Column(name = "delivery_deadline")
    private LocalDateTime deliveryDeadline;
}
